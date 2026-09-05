use axum::{body::Body, extract::Multipart};
use std::{
    env::home_dir,
    io::{Error, ErrorKind},
    path::PathBuf,
};
use tokio::fs::{ReadDir, read_dir};

#[derive(Clone, Debug)]
pub struct FileCharter {
    temp_root: PathBuf,
}

impl FileCharter {
    pub fn new() -> Self {
        let home = home_dir()
            .expect("No home directory found")
            .canonicalize()
            .unwrap();

        FileCharter {
            // Maybe create a builder method to set custom roots for others to use.
            temp_root: home.clone(),
        }
    }

    async fn mapper(paths: &mut ReadDir) -> Result<Vec<String>, Error> {
        let mut directories: Vec<String> = Vec::new();

        while let Some(p) = paths.next_entry().await? {
            directories.push(
                p.path()
                    .file_name()
                    .expect("")
                    .to_string_lossy()
                    .into_owned(),
            );
        }

        Ok(directories)
    }

    async fn return_result(&self, path: &PathBuf) -> Result<Vec<String>, Error> {
        let mut registries = read_dir(path).await?;
        let col = Self::mapper(&mut registries).await;
        if let Ok(i) = col {
            Ok(i)
        } else {
            Err(Error::new(ErrorKind::AddrNotAvailable, "error"))
        }
    }

    pub async fn get_dir_from_path(&self, url: &str) -> Result<Vec<String>, Error> {
        let path_mut = &self.temp_root;

        if !(url == "/") {
            let joined_path = path_mut.join(url);
            self.return_result(&joined_path).await
        } else {
            self.return_result(path_mut).await
        }
    }

    pub async fn download_file(&self, url: &str) -> Result<Body, Error> {
        let path_mut = &self.temp_root.join(url);

        // Reads the file asynchronously
        let open = tokio::fs::File::open(path_mut).await?;

        let stream = tokio_util::io::ReaderStream::new(open);

        let body = Body::from_stream(stream);
        Ok(body)
    }

    pub async fn delete(&self, path: &str) -> Result<&str, Error> {
        let path_mut = &self.temp_root.join(path);

        let has_extension = path_mut.extension().is_some();

        if has_extension {
            tokio::fs::remove_file(path_mut).await?;
            println!("File have been deleted");
            Ok("ok")
        } else {
            // Removes entire folder
            tokio::fs::remove_dir_all(path_mut).await?;
            println!("The folder with content has been deleted");
            Ok("ok")
        }
    }

    pub async fn read_file(&self, file: &str) -> Result<String, Error> {
        let path_mut = &self.temp_root.join(file);
        let content = tokio::fs::read_to_string(path_mut).await?;
        Ok(content)
    }

    pub async fn preview_img(&self, img: &str) -> Result<Vec<u8>, Error> {
        let path_mut = &self.temp_root.join(img);
        let content = tokio::fs::read(path_mut).await?;
        Ok(content)
    }

    pub async fn upload_file(&self, mut multipart: Multipart) -> Result<String, Error> {
        let path_mut = &self.temp_root.to_path_buf();
        while let Some(field) = multipart.next_field().await.unwrap() {
            let file = field.file_name().expect("File name not found").to_string();
            let data = field
                .bytes()
                .await
                .expect("Something went wrong with reading bytes");
            tokio::fs::write(path_mut.join(file), data).await?;
        }
        Ok("Ok".to_string())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use tempfile::tempdir;
    use tokio::fs;

    // Build a FileCharter rooted at an isolated temp dir so tests never touch the
    // real $HOME. Constructing the struct directly lets us inject a custom root
    // (FileCharter::new() always points at the home directory).
    //
    // The FileCharter object takes a pathBuf object, it is initialised and set to home dir by default when calling its constructor.
    fn charter_at(root: &std::path::Path) -> FileCharter {
        FileCharter {
            temp_root: root.to_path_buf(),
        }
    }

    // Uses tempdir crate, which allows us to create temporary directory in the file system and immediately destroy it
    // once destructor is called or when it goes out of scope.
    #[tokio::test]
    async fn lists_root_directory_entries() {
        let dir = tempdir().unwrap();
        fs::create_dir(dir.path().join("sub")).await.unwrap();
        fs::write(dir.path().join("a.txt"), b"hi").await.unwrap();

        let charter = charter_at(dir.path());
        let mut entries = charter.get_dir_from_path("/").await.unwrap();
        entries.sort();

        assert_eq!(entries, vec!["a.txt".to_string(), "sub".to_string()]);
    }

    #[tokio::test]
    async fn lists_nested_directory_entries() {
        let dir = tempdir().unwrap();
        fs::create_dir(dir.path().join("docs")).await.unwrap();
        fs::write(dir.path().join("docs").join("note.md"), b"x")
            .await
            .unwrap();

        let charter = charter_at(dir.path());
        let entries = charter.get_dir_from_path("docs").await.unwrap();

        assert_eq!(entries, vec!["note.md".to_string()]);
    }

    #[tokio::test]
    async fn get_dir_from_missing_path_errors() {
        let dir = tempdir().unwrap();
        let charter = charter_at(dir.path());
        assert!(charter.get_dir_from_path("does-not-exist").await.is_err());
    }

    #[tokio::test]
    async fn reads_file_contents() {
        let dir = tempdir().unwrap();
        fs::write(dir.path().join("hello.txt"), b"hello world")
            .await
            .unwrap();

        let charter = charter_at(dir.path());
        let content = charter.read_file("hello.txt").await.unwrap();
        assert_eq!(content, "hello world");
    }

    #[tokio::test]
    async fn preview_img_returns_raw_bytes() {
        let dir = tempdir().unwrap();
        let bytes = [0u8, 1, 2, 3, 255];
        fs::write(dir.path().join("pixel.png"), bytes)
            .await
            .unwrap();

        let charter = charter_at(dir.path());
        let out = charter.preview_img("pixel.png").await.unwrap();
        assert_eq!(out, bytes.to_vec());
    }

    #[tokio::test]
    async fn download_file_streams_contents() {
        let dir = tempdir().unwrap();
        fs::write(dir.path().join("data.bin"), b"streamed-bytes")
            .await
            .unwrap();

        let charter = charter_at(dir.path());
        let body = charter.download_file("data.bin").await.unwrap();
        let bytes = axum::body::to_bytes(body, usize::MAX).await.unwrap();
        assert_eq!(&bytes[..], b"streamed-bytes");
    }

    #[tokio::test]
    async fn download_missing_file_errors() {
        let dir = tempdir().unwrap();
        let charter = charter_at(dir.path());
        assert!(charter.download_file("nope.bin").await.is_err());
    }

    #[tokio::test]
    async fn deletes_a_file() {
        let dir = tempdir().unwrap();
        let file = dir.path().join("temp.txt");
        fs::write(&file, b"bye").await.unwrap();

        let charter = charter_at(dir.path());
        let result = charter.delete("temp.txt").await.unwrap();

        assert_eq!(result, "ok");
        assert!(!file.exists());
    }

    #[tokio::test]
    async fn deletes_a_directory_recursively() {
        let dir = tempdir().unwrap();
        let folder = dir.path().join("folder");
        fs::create_dir(&folder).await.unwrap();
        fs::write(folder.join("inner.txt"), b"x").await.unwrap();

        let charter = charter_at(dir.path());
        let result = charter.delete("folder").await.unwrap();

        assert_eq!(result, "ok");
        assert!(!folder.exists());
    }

    #[tokio::test]
    async fn delete_missing_file_errors() {
        let dir = tempdir().unwrap();
        let charter = charter_at(dir.path());
        assert!(charter.delete("nope.txt").await.is_err());
    }
}
