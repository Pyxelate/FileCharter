use std::path::PathBuf;
use std::sync::Arc;
use tower_http::cors::{CorsLayer, Any};
use tower::ServiceBuilder;
use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Router,
    routing::get,
    Json,
    body::Bytes,
};
use axum::http::{header, Method, StatusCode};
use axum_extra::either::Either;
use crate::filec::FileCharter;
use serde::Serialize;

#[derive(Clone)]
pub struct Server{

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


impl Server {
    pub fn new() -> Self {
        Server{

        }
    }
    pub async fn start(&self) {
        let cors = CorsLayer::new().allow_methods([Method::GET, Method::POST]).allow_origin(Any);
        let fileCharter = FileCharter::new();
        // with state, requres the impl to have the trait Clone #[derive(Clone)], because it passes a new veresion of it everywhere.
        let app = Router::new().route("/", get(serve_root_dir))
            .route("/{*filename}", get(serve_dir))
            .route("/preview/{*image}", get(preview_image))
            .with_state(fileCharter)// Canonicalise at some point to stop bad attackeres.
            .layer(
                ServiceBuilder::new().layer(cors)
            );

        let address = "127.0.0.1:8080";

        let listener = tokio::net::TcpListener::bind(address).await.unwrap();
        axum::serve(listener, app).await.unwrap();
    }
}


// Very strict type safety, returning json needs a type of object that would be of json.
// Using axum-extra Either is very handy. Either<E1, E2, ...> Where E1 could be json, and e2 could be a string for error
// To return the type Either<E1, E2>: Either::E1({Object to return}) or Either::E2...

async fn serve_root_dir(State(state): State<FileCharter>) -> Either<Json<Directory>, Json<Error>>{
    let result = state.get_root_files();

    match result {
        Some(res) => {
            let body = Directory {
                directory: res
            };
            Either::E1(Json(body))
        },
        None => {

            let err = Error {
                code: 0,
                message: "".to_string(),
            };
            Either::E2((Json(err)))
        }
    }
}

async fn serve_dir(State(state): State<FileCharter>, Path(filename): Path<String>) -> Either<Json<Directory>, Json<Error>>{
    let result = state.get_dir_files(filename);

    match result {
        Some(res) => {
            let body = Directory {
                directory: res
            };
            Either::E1(Json(body))
        },
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
            (header::CACHE_CONTROL, "public, max-age=31536000")
        ],
        Bytes::from(img)
        )
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
