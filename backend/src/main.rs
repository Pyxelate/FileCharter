pub mod filec;
pub mod server;

use std::error::Error;

// TODO: Login, Logout, Signup handlers.
// Add protected routes to the main apis.
// Create Auth form on frontend.
//

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let server = server::Server::new();

    // let test = users.find_one(doc! {"username": "mongoose"}).await?;
    // println!("{:?}", test);
    server.start().await;
    Ok(())
}
