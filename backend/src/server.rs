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
use axum_login::{AuthManagerLayer, login_required};
use axum_login::{AuthManagerLayerBuilder, AuthUser, AuthnBackend, UserId};
use password_auth::verify_password;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt::format;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::task;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};
use tower_sessions::{Expiry, MemoryStore, SessionManagerLayer, cookie::time::Duration};

#[derive(Clone)]
pub struct Server {}

#[derive(Serialize)]
struct Directory {
    directory: Vec<String>,
}

// #[derive(Serialize)]
// struct Error {
//     code: i32,
//     message: String,
// }

#[derive(Clone)]
struct AppState {
    charter: Arc<FileCharter>,
}

use mongodb::{
    Client, Collection, Database,
    bson::{Document, doc, oid::ObjectId},
};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Users {
    #[serde(rename = "_id")]
    id: Option<ObjectId>,
    username: String,
    password: String,
}

impl AuthUser for Users {
    type Id = ObjectId;

    fn id(&self) -> Self::Id {
        self.id.unwrap()
    }

    fn session_auth_hash(&self) -> &[u8] {
        &self.password.as_bytes()
    }
}

#[derive(Clone, Deserialize)]
struct Credentials {
    username: String,
    password: String,
}

#[derive(Clone)]
struct Backend {
    users: Collection<Users>,
}
#[derive(Debug, thiserror::Error)]
enum AuthErrors {
    #[error(transparent)]
    Mongo(#[from] mongodb::error::Error),
    #[error(transparent)]
    TaskJoin(#[from] task::JoinError),
}

impl Backend {
    pub fn new(db: &Database) -> Self {
        Self {
            users: db.collection("users"),
        }
    }
}

impl AuthnBackend for Backend {
    type User = Users;
    type Credentials = Credentials;
    type Error = AuthErrors;

    async fn authenticate(
        &self,
        creds: Self::Credentials,
    ) -> Result<Option<Self::User>, Self::Error> {
        // We have to manually implement the authenticate functionality. Authentication with argon2 is blocking,
        // best to do it asynchronously.

        let user = self
            .users
            .find_one(doc! {"username": &creds.username})
            .await?;
        let verified = task::spawn_blocking(move || {
            user.filter(|u| verify_password(&creds.password, &u.password).is_ok())
        })
        .await?;
        Ok(verified)
    }

    async fn get_user(&self, user_id: &UserId<Self>) -> Result<Option<Self::User>, Self::Error> {
        // Uses Mongodb's function calls to fetch user, sort of like an sql query select user where username = ...
        Ok(self.users.find_one(doc! {"_id": *user_id}).await?)
    }
}

impl Server {
    pub fn new() -> Self {
        Server {}
    }

    pub async fn start(&self) -> Result<(), Box<dyn Error>> {
        let username =
            std::env::var("MONGO_INITDB_ROOT_USERNAME").unwrap_or_else(|_| "mongo".to_string());
        let password =
            std::env::var("MONGO_INITDB_ROOT_PASSWORD").unwrap_or_else(|_| "password".to_string());
        let uri = format!("mongodb://{}:{}@localhost:27017", username, password);
        let client = Client::with_uri_str(uri).await?;
        let db = client.database("local_users");
        // let users: Collection<Users> = db.collection("users");
        let backend = Backend::new(&db);
        let session_expiry = Expiry::OnInactivity(Duration::hours(1));
        let session_store = MemoryStore::default();
        let session_layer = SessionManagerLayer::new(session_store).with_expiry(session_expiry);

        let auth_layer = AuthManagerLayerBuilder::new(backend, session_layer).build();

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
            .route_layer(login_required!(Backend))
            .route("/login", post(login))
            .with_state(file_charter) // Canonicalize at some point to stop bad attackeres.
            .layer(ServiceBuilder::new().layer(cors))
            .layer(auth_layer);

        let address = "127.0.0.1:8080";

        let listener = tokio::net::TcpListener::bind(address).await.unwrap();
        axum::serve(listener, app).await.unwrap();
        Ok(())
    }
}

//
// Controller layer
//

async fn login(
    mut auth: axum_login::AuthSession<Backend>,
    axum::Json(creds): axum::Json<Credentials>,
) -> impl IntoResponse {
    match auth.authenticate(creds).await {
        // Authenticate returns a result of optional user. Calls the auth session login method.
        Ok(Some(user)) => {
            let _ = auth.login(&user).await;
            StatusCode::OK
        }
        // If result returns none, then user is unauthorized.
        Ok(None) => StatusCode::UNAUTHORIZED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
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
