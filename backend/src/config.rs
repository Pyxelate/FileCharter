pub struct Config {}

impl Config {
    pub fn get_frontend_port() -> String {
        let port = std::env::var("FRONTEND_PORT");

        match port {
            Ok(result) => result,
            Err(_) => panic!("No frontend port env found!"),
        }
    }

    pub fn get_root_directory_configuration() -> String {
        let root = std::env::var("FILECHARTER_ROOT_DIR");

        match root {
            Ok(result) => result,
            Err(_) => panic!("No directory env found!"),
        }
    }

    pub fn get_host_port() -> String {
        let port = std::env::var("BACKEND_PORT");

        match port {
            Ok(result) => result,
            Err(_) => panic!("No host port env found!"),
        }
    }

    pub fn get_mongo_username() -> String {
        let username = std::env::var("MONGO_USERNAME");

        match username {
            Ok(result) => result,
            Err(_) => panic!("No mongo username env found!"),
        }
    }

    pub fn get_mongo_password() -> String {
        let password = std::env::var("MONGO_PASSWORD");

        match password {
            Ok(result) => result,
            Err(_) => panic!("No mongo password env found!"),
        }
    }

    pub fn get_mongo_port() -> String {
        let port = std::env::var("MONGO_PORT");

        match port {
            Ok(result) => result,
            Err(_) => panic!("No mongo port env found!"),
        }
    }
}
