pub mod server;
pub mod filec;


#[tokio::main]
async fn main() {
    let server = server::Server::new();

    server.start().await;
}