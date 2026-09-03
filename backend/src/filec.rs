// use axum::body::Body;
// use axum::extract::multipart::Multipart;
// use axum::http::{HeaderName, StatusCode, header};
// use axum::response::IntoResponse;
// use serde::ser::Error;
// use std::ffi::OsString;
// use std::fmt::format;
// use std::fs::read_dir;
// use std::path::PathBuf;
// use std::{fs, io};
// use tokio::fs::ReadDir;
// use tokio::io::AsyncReadExt;
// use tokio_util::io::ReaderStream;

// // Overhaul this to become asynchronous with tokio, at the moment everything is blocking.

// #[derive(Clone)]
// pub struct FileCharter {}

// impl FileCharter {
//     pub fn new() -> Self {
//         FileCharter {}
//     }

//     async fn mapper(url: &ReadDir) -> Option<Vec<String>> {
//         let files: Result<Vec<_>, io::Error> = url
//             .map(|dir| {
//                 dir.map(|p| {
//                     p.path()
//                         .file_name()
//                         .expect("Can't get file name")
//                         .to_string_lossy()
//                         .into_owned()
//                 })
//             })
//             .collect();
//     }

//     // Retrieves some string with directory path, should be passed via business layer.
//     pub fn get_dir_path(&self, url: &str) -> Option<Vec<String>> {
//         let root = std::env::home_dir()?;

//         if url == "/" {
//             let reg = read_dir(root).expect("Can't read dir");

//             let files: Result<Vec<_>, io::Error> = reg
//                 .map(|dir| {
//                     dir.map(|p| {
//                         p.path()
//                             .file_name()
//                             .expect("Can't get file name")
//                             .to_string_lossy()
//                             .into_owned()
//                     })
//                 })
//                 .collect();

//             if let Ok(e) = files { Some(e) } else { None }
//         } else {
//             None
//         }
//     }

//     pub fn get_root_files(&self) -> Option<Vec<String>> {
//         let root_path = std::env::home_dir().unwrap();
//         let registries = read_dir(root_path);
//         if let Ok(registry) = registries {
//             let files: Result<Vec<_>, io::Error> = registry
//                 .map(|t| {
//                     t.map(|t1| {
//                         t1.path()
//                             .file_name()
//                             .unwrap()
//                             .to_string_lossy()
//                             .into_owned()
//                     })
//                 })
//                 .collect();

//             if let Ok(e) = files { Some(e) } else { None }
//         } else {
//             None
//         }
//     }

//     pub fn get_dir_files(&self, directory: String) -> Option<Vec<String>> {
//         let root_path = std::env::home_dir().unwrap();
//         let deep_dir = root_path.join(directory);
//         println!("{:?}", &deep_dir);

//         let registries = read_dir(deep_dir);
//         if let Ok(registry) = registries {
//             let files: Result<Vec<_>, io::Error> = registry
//                 .map(|t| {
//                     t.map(|t1| {
//                         t1.path()
//                             .file_name()
//                             .unwrap()
//                             .to_string_lossy()
//                             .into_owned()
//                     })
//                 })
//                 .collect();

//             if let Ok(e) = files { Some(e) } else { None }
//         } else {
//             None
//         }
//     }

//     // pub fn delete(&self, item: &str) -> Result<(), ()> {
//     //     let splitted: Vec<_> = item.split(".").into_iter().collect();
//     //     let full_path = PathBuf::from(item).canonicalize().unwrap();
//     //
//     //     // refactor this, could be one code instead of it being duplicated
//     //     if splitted.len() >1 {
//     //         let res = std::fs::remove_file(full_path);
//     //         if let Ok(()) = res {
//     //             Ok(())
//     //         } else {
//     //             Err(())
//     //         }
//     //     } else {
//     //         let res = std::fs::remove_dir(full_path);
//     //         if let Ok(()) = res {
//     //             Ok(())
//     //         } else {
//     //             Err(())
//     //         }
//     //     }
//     // }

//     pub async fn download(&self, file: String) -> Result<((Body, [(HeaderName, String); 2])), ()> {
//         let root_path = std::env::home_dir().unwrap().canonicalize().unwrap();
//         let deep_dir = &root_path.join(&file);

//         let open = tokio::fs::File::open(&deep_dir).await.unwrap();
//         let read_content = ReaderStream::new(open);

//         let body = Body::from_stream(read_content);

//         let headers: [(HeaderName, String); 2] = [
//             (header::CONTENT_TYPE, "application/octet-stream".to_string()),
//             (
//                 header::CONTENT_DISPOSITION,
//                 format!("attachment/ filename=\"{:?}\"", deep_dir),
//             ),
//         ];

//         Ok((body, headers))
//     }

//     pub async fn read_file(&self, file: String) -> Result<(String), ()> {
//         let root_path = std::env::home_dir().unwrap().canonicalize().unwrap();
//         let deep_dir = &root_path.join(&file);

//         let content = fs::read_to_string(deep_dir).unwrap();
//         //
//         // let mut file = tokio::fs::File::open(&deep_dir).await.unwrap();
//         // let mut buffer = Vec::new();
//         // let content = file.read_to_end(&mut buffer).await.unwrap().to_ne_bytes().to_vec();

//         Ok(content)
//     }
// }

// #[cfg(test)]
// #[test]
// fn is_home_dir() {
//     let dir = std::env::home_dir().unwrap();
//     // println!("{:?}", &dir);
//     assert_eq!(dir.to_str().unwrap(), "/Users/vincent");
// }

use axum::body::Body;
use std::{
    borrow::Cow,
    env::home_dir,
    io::{Error, ErrorKind},
    path::{Path, PathBuf},
};
use tokio::fs::{ReadDir, read_dir};

#[derive(Clone, Debug)]
pub struct FileCharter<'a> {
    temp_root: Cow<'a, Path>,
}

impl<'a> FileCharter<'a> {
    pub fn new() -> Self {
        let home = home_dir()
            .expect("No home directory found")
            .canonicalize()
            .unwrap();

        FileCharter {
            // Maybe create a builder method to set custom roots for others to use.
            temp_root: Cow::Owned(home),
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

    pub async fn get_dir_from_path(&self, url: &str) -> Result<Vec<String>, Error> {
        let path_mut = self.temp_root.to_path_buf();
        if !(url == "/") {
            path_mut.join(url);
        }

        let mut registries = read_dir(path_mut).await?;
        let col = Self::mapper(&mut registries).await;
        if let Ok(i) = col {
            Ok(i)
        } else {
            Err(Error::new(ErrorKind::AddrNotAvailable, "error"))
        }
    }

    pub async fn download_file(&self, url: &str) -> Result<Body, Error> {
        let path_mut = self.temp_root.to_path_buf().join(url);

        // Reads the file asynchronously
        let open = tokio::fs::File::open(path_mut).await?;

        let stream = tokio_util::io::ReaderStream::new(open);

        let body = Body::from_stream(stream);
        Ok(body)

        // Header will be applied in controller
        // (header::CONTENT_TYPE, "application/octet-stream".to_string()),
        //             (
        //                 header::CONTENT_DISPOSITION,
        //                 format!("attachment/ filename=\"{:?}\"", deep_dir),
        //             ),
    }

    pub async fn delete(&self, path: &str) -> Result<&str, Error> {
        let path_mut = self.temp_root.to_path_buf().join(path);

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
