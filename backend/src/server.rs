use crate::filec::FileCharter;
use axum::extract::Multipart;
use axum::http::{Method, StatusCode, header};
use axum::routing::post;
use axum::{
    Json, Router,
    body::Bytes,
    extract::{Path, State},
    response::IntoResponse,
    routing::get,
};
use axum_extra::either::Either;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct Server {}

#[derive(Serialize)]
struct Directory {
    directory: Vec<String>,
}

#[derive(Serialize)]
struct Error {
    code: i32,
    message: String,
}

impl Server {
    pub fn new() -> Self {
        Server {}
    }

    pub async fn start(&self) {
        let cors = CorsLayer::new()
            .allow_methods([Method::GET, Method::POST])
            .allow_origin(Any);
        let fileCharter = FileCharter::new();
        // with state, requres the impl to have the trait Clone #[derive(Clone)], because it passes a new veresion of it everywhere.
        let app = Router::new()
            .route("/", get(serve_root_dir))
            .route("/{*filename}", get(serve_dir))
            .route("/preview/{*image}", get(preview_image))
            .route("/download/{*file}", get(download_file))
            .route("/read/{*file}", get(read_content))
            .route("/upload", post(upload_file))
            .with_state(fileCharter) // Canonicalize at some point to stop bad attackeres.
            .layer(ServiceBuilder::new().layer(cors));

        let address = "127.0.0.1:8080";

        let listener = tokio::net::TcpListener::bind(address).await.unwrap();
        axum::serve(listener, app).await.unwrap();
    }

    async fn test() {
        println!("test");
    }
}

// Very strict type safety, returning json needs a type of object that would be of json.
// Using axum-extra Either is very handy. Either<E1, E2, ...> Where E1 could be json, and e2 could be a string for error
// To return the type Either<E1, E2>: Either::E1({Object to return}) or Either::E2...

async fn serve_root_dir(State(state): State<FileCharter>) -> Either<Json<Directory>, Json<Error>> {
    let result = state.get_root_files();

    match result {
        Some(res) => {
            let body = Directory { directory: res };
            Either::E1(Json(body))
        }
        None => {
            let err = Error {
                code: 0,
                message: "".to_string(),
            };
            Either::E2((Json(err)))
        }
    }
}

async fn serve_dir(
    State(state): State<FileCharter>,
    Path(filename): Path<String>,
) -> Either<Json<Directory>, Json<Error>> {
    println!("{filename}");
    let result = state.get_dir_files(filename);
    // println!("{:?}", result.clone().unwrap());

    match result {
        Some(res) => {
            let body = Directory { directory: res };
            Either::E1(Json(body))
        }
        None => {
            let err = Error {
                code: 0,
                message: "".to_string(),
            };
            Either::E2((Json(err)))
        }
    }
}

async fn preview_image(Path(image): Path<String>) -> impl IntoResponse {
    let root_path = std::env::home_dir().unwrap().canonicalize().unwrap();
    let deep_dir = &root_path.join(&image);
    println!("{deep_dir:?}");
    let img = std::fs::read(deep_dir).unwrap();

    (
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "image/png"),
            (header::CACHE_CONTROL, "public, max-age=31536000"),
        ],
        Bytes::from(img),
    )
}

async fn download_file(
    State(state): State<FileCharter>,
    Path(file): Path<String>,
) -> impl IntoResponse {
    let item = state.download(file).await.unwrap();
    let (body, header) = item;
    (StatusCode::OK, header, body)
}

async fn read_content(State(state): State<FileCharter>, Path(file): Path<String>) -> Json<String> {
    let root_path = std::env::home_dir().unwrap().canonicalize().unwrap();
    let deep_dir = &root_path.join(&file);
    let buffer = state
        .read_file(deep_dir.to_string_lossy().into_owned())
        .await
        .unwrap();

    Json(buffer)
}

pub async fn upload_file(mut multipart: Multipart) -> impl IntoResponse {
    while let Some(field) = multipart.next_field().await.unwrap() {
        let filename = field.file_name().unwrap_or("uploaded_file").to_string();
        // Gets teh field Object Field from multipart (http form data specific object). Uses tokio file system write, it asyncronously
        // writes the file to a specified path appended {} filename to write the name of the file and then the content is body.,
        let data = field.bytes().await.unwrap();
        let from_root = std::env::home_dir()
            .unwrap()
            .canonicalize()
            .unwrap()
            .to_string_lossy()
            .into_owned();
        tokio::fs::write(format!("{from_root}/{}", filename), data)
            .await
            .unwrap();
    }
}

//
// async fn delete_item(State(state): State<FileCharter>, Path(path): Path<&str>) -> String {
//     let result = state.delete(path);
//     if let Ok(i) = state.delete(path) {
//         // Either::E1(Json({Directory {directory}}))
//         "Worked".to_string()
//     } else {
//         "not worked".to_string()
//     }
// }
//
