use std::ffi::OsString;
use std::fs::read_dir;
use std::{fs, io};
use std::fmt::format;
use std::path::{PathBuf};
use axum::body::Body;
use axum::extract::multipart::Multipart;
use axum::http::{header, HeaderName, StatusCode};
use axum::response::IntoResponse;
use tokio::io::AsyncReadExt;
use tokio_util::io::ReaderStream;


// Overhaul this to become asynchronous with tokio, at the moment everything is blocking.

#[derive(Clone)]
pub struct FileCharter{

}

impl FileCharter {
    pub fn new() -> Self {

        FileCharter {

        }
    }

    pub fn get_root_files(&self) -> Option<Vec<String>> {
        let root_path = std::env::home_dir().unwrap();
        let registries = read_dir(root_path);
        if let Ok(registry) = registries {
            let files: Result<Vec<_>, io::Error> =  registry.map(|t| {
                t.map(|t1| {
                    t1.path().file_name().unwrap().to_string_lossy().into_owned()
                })
            }).collect();

            if let Ok(e) = files {
                Some(e)
            } else {
                None

            }

        } else {None}
    }

    pub fn get_dir_files(&self, directory: String) -> Option<Vec<String>> {
        let root_path = std::env::home_dir().unwrap();
        let deep_dir = root_path.join(directory);
        println!("{:?}", &deep_dir);


        let registries = read_dir(deep_dir);
        if let Ok(registry) = registries {
            let files: Result<Vec<_>, io::Error> =  registry.map(|t| {
                t.map(|t1| {
                    t1.path().file_name().unwrap().to_string_lossy().into_owned()
                })
            }).collect();

            if let Ok(e) = files {
                Some(e)
            } else {
                None

            }
        } else {None}
    }



    // pub fn delete(&self, item: &str) -> Result<(), ()> {
    //     let splitted: Vec<_> = item.split(".").into_iter().collect();
    //     let full_path = PathBuf::from(item).canonicalize().unwrap();
    //
    //     // refactor this, could be one code instead of it being duplicated
    //     if splitted.len() >1 {
    //         let res = std::fs::remove_file(full_path);
    //         if let Ok(()) = res {
    //             Ok(())
    //         } else {
    //             Err(())
    //         }
    //     } else {
    //         let res = std::fs::remove_dir(full_path);
    //         if let Ok(()) = res {
    //             Ok(())
    //         } else {
    //             Err(())
    //         }
    //     }
    // }

    pub async fn download(&self, file: String) -> Result<((Body,[(HeaderName, String); 2])),()> {
        let root_path = std::env::home_dir().unwrap().canonicalize().unwrap();
        let deep_dir = &root_path.join(&file);


        let open = tokio::fs::File::open(&deep_dir).await.unwrap();
        let read_content = ReaderStream::new(open);

        let body = Body::from_stream(read_content);

        let headers: [(HeaderName, String); 2] = [
            (header::CONTENT_TYPE, "application/octet-stream".to_string()), (
                header::CONTENT_DISPOSITION, format!("attachment/ filename=\"{:?}\"", deep_dir)
            ),
        ];

        Ok((body, headers))
    }

    pub async fn read_file(&self, file: String) -> Result<(String),()> {
        let root_path = std::env::home_dir().unwrap().canonicalize().unwrap();
        let deep_dir = &root_path.join(&file);

        let content = fs::read_to_string(deep_dir).unwrap();
        //
        // let mut file = tokio::fs::File::open(&deep_dir).await.unwrap();
        // let mut buffer = Vec::new();
        // let content = file.read_to_end(&mut buffer).await.unwrap().to_ne_bytes().to_vec();


        Ok(content)
    }
    
}


#[cfg(test)]

#[test]
fn is_home_dir() {
    let dir =std::env::home_dir().unwrap();
    // println!("{:?}", &dir);
    assert_eq!(dir.to_str().unwrap(), "/Users/vincent");
}