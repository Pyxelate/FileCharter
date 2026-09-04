use crate::filec::FileCharter;
use axum::extract::Multipart;
use axum::http::{HeaderName, Method, StatusCode, header};
use axum::routing::{delete, post};
use axum::{
    Json, Router,
    body::Bytes,
    extract::{Path, State},
    response::IntoResponse,
    routing::get,
};
use axum_extra::either::Either;
use serde::Serialize;
use std::fmt::format;
use std::path::PathBuf;
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::classify::GrpcCode::Ok;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct Server {
    charter: FileCharter,
}

#[derive(Serialize)]
struct Directory {
    directory: Vec<String>,
}

#[derive(Serialize)]
struct Error {
    code: i32,
    message: String,
}

#[derive(Clone)]
struct AppState {
    charter: Arc<FileCharter>,
}

impl Server {
    pub fn new() -> Self {
        Server {
            charter: FileCharter::new(),
        }
    }

    pub async fn start(&self) {
        let cors = CorsLayer::new()
            .allow_methods([Method::GET, Method::POST])
            .allow_origin(Any);
        let file_charter = AppState {
            charter: Arc::new(FileCharter::new()),
        };
        // with state, requres the impl to have the trait Clone #[derive(Clone)], because it passes a new veresion of it everywhere.
        let app = Router::new()
            .route("/", get(root_dir))
            .route("/{*filename}", get(fetch_directory_paths))
            .route("/preview/image/{*image}", get(preview_image))
            .route("/preview/file/{*file}", get(preview_file))
            .route("/download/{*file}", get(download_file))
            .route("/delete/{*file}", delete(delete_file))
            .route("/upload", post(upload_file))
            .with_state(file_charter) // Canonicalize at some point to stop bad attackeres.
            .layer(ServiceBuilder::new().layer(cors));

        let address = "127.0.0.1:8080";

        let listener = tokio::net::TcpListener::bind(address).await.unwrap();
        axum::serve(listener, app).await.unwrap();
    }
}

async fn root_dir(State(state): State<AppState>) -> Json<Directory> {
    let directories = state.charter.get_dir_from_path("/").await.unwrap();
    Json(Directory {
        directory: directories,
    })
}

async fn fetch_directory_paths(
    State(state): State<AppState>,
    Path(filename): Path<String>,
) -> Json<Directory> {
    let directories = state
        .charter
        .get_dir_from_path(filename.as_str())
        .await
        .unwrap();
    Json(Directory {
        directory: directories,
    })
}

async fn preview_image(
    State(state): State<AppState>,
    Path(image): Path<String>,
) -> impl IntoResponse {
    let data = state.charter.preview_img(image.as_str()).await.unwrap();

    let response = (
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "image/png"),
            (header::CACHE_CONTROL, "public, max-age=9999"),
        ],
        // Body
        Bytes::from(data),
    );
    response
}

async fn preview_file(State(state): State<AppState>, Path(file): Path<String>) -> Json<String> {
    let file_content = state.charter.read_file(file.as_str()).await.unwrap();
    Json(file_content)
}

async fn download_file(
    State(state): State<AppState>,
    Path(file): Path<String>,
) -> impl IntoResponse {
    let body = state.charter.download_file(file.as_str()).await.unwrap();
    let headers: [(HeaderName, String); 2] = [
        (header::CONTENT_TYPE, "application/octet-stream".to_string()),
        (
            header::CONTENT_DISPOSITION,
            format!("attachment/ filename=\"{:?}\"", file),
        ),
    ];
    (StatusCode::OK, headers, body)
}

async fn upload_file(State(state): State<AppState>, multipart: Multipart) -> Json<String> {
    let result = state.charter.upload_file(multipart).await.unwrap();
    if result == "Ok" {
        Json("File has been uploaded!".to_string())
    } else {
        Json("err".to_string())
    }
}

async fn delete_file(State(state): State<AppState>, Path(file): Path<String>) -> Json<String> {
    let result = state.charter.delete(file.as_str()).await.unwrap();
    Json(result.to_string())
}

// Very strict type safety, returning json needs a type of object that would be of json.
// Using axum-extra Either is very handy. Either<E1, E2, ...> Where E1 could be json, and e2 could be a string for error
// To return the type Either<E1, E2>: Either::E1({Object to return}) or Either::E2...
