/// A macro for chaining multiple `Option` or `Result` operations.
/// For example:
///
/// ```rust
/// use kea_server::try_chain;
///
/// struct User {
///    name: Option<String>,
/// }
///
/// let user = Some(User { name: Some("Alice".to_string()) });
///
/// let result = try_chain!(user => name).unwrap();;
/// assert_eq!(Some("Alice".to_string()), result);
/// ```
///
#[macro_export]
macro_rules! try_chain {
    // Base case - single identifier
    ($val:expr) => { $val };

    // Method call with arguments
    ($val:expr => $method:ident($($arg:expr),*)) => {
        $val.and_then(|v| v.$method($($arg),*))
    };

    // Field access
    ($val:expr => $field:ident) => {
        $val.map(|v| v.$field)
    };

    // Chain multiple operations
    ($val:expr => $field:ident => $($rest:tt)*) => {
        try_chain!(try_chain!($val => $field) => $($rest)*)
    };

    ($val:expr => $method:ident($($arg:expr),*) => $($rest:tt)*) => {
        try_chain!(try_chain!($val => $method($($arg),*)) => $($rest)*)
    };
}
