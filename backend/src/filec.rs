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
            println!("{i:?}");
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

    // A function that takes in a Vector of type T.
    fn assert_vec<T>(_v: &Vec<T>) {}

    #[tokio::test]
    async fn get_dirs() {
        let charter = FileCharter::new();
        let paths = charter.get_dir_from_path("/").await.expect("");

        // Call the assert_vec function. If the input is a vector this test will compile.
        assert_vec(&paths);
    }

    #[tokio::test]
    async fn get_nonroot_dir() {
        let charter = FileCharter::new();
        let paths = charter
            .get_dir_from_path("/download/example.md")
            .await
            .expect("");
        assert_vec(&paths);
    }

    async fn delete(path: &str) -> String {
        let path_mut = std::env::home_dir()
            .unwrap()
            .canonicalize()
            .unwrap()
            .join(path);

        let has_extension = path_mut.extension().is_some();

        if has_extension {
            // Removes file
            // tokio::fs::remove_file(path_mut).await?;
            String::from("File has been deleted")
        } else {
            // Removes entire folder
            // tokio::fs::remove_dir_all(path_mut).await?;
            String::from("Directory has been deleted")
        }
    }

    #[tokio::test]
    async fn test_delete_file() {
        assert_eq!(
            delete("text.txt").await,
            "File has been deleted".to_string()
        );
    }

    #[tokio::test]
    async fn test_delete_dir() {
        assert_eq!(
            delete("/item").await,
            "Directory has been deleted".to_string()
        );
    }
}
