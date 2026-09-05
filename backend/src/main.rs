pub mod filec;
pub mod server;

use std::error::Error;

// TODO: Login, Logout, Signup handlers.
// Add protected routes to the main apis.
// Create Auth form on frontend.
//

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();
    let server = server::Server::new();

    // let test = users.find_one(doc! {"username": "mongoose"}).await?;
    // println!("{:?}", test);
    server.start().await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::{filec::FileCharter, server::Server};

    // Smoke tests: the binary's modules wire up and their entry points construct
    // without panicking. main() itself starts a listening server, so it is covered
    // by integration/manual testing rather than a unit test.
    #[test]
    fn server_constructs() {
        let _ = Server::new();
    }

    #[test]
    fn file_charter_constructs() {
        let _ = FileCharter::new();
    }
}
