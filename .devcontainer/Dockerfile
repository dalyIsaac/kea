FROM mcr.microsoft.com/devcontainers/rust:1-bookworm

ARG USERNAME=vscode

# Include lld linker to improve build times either by using environment variable
# RUSTFLAGS="-C link-arg=-fuse-ld=lld" or with Cargo's configuration file (i.e see .cargo/config.toml).
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
   && apt-get -y install clang lld libssl-dev pkg-config \
   && apt-get autoremove -y && apt-get clean -y

# Persist shell history.
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.zsh_history" \
   && mkdir /commandhistory \
   && touch /commandhistory/.zsh_history \
   && chown -R $USERNAME /commandhistory \
   && echo "$SNIPPET" >> "/home/$USERNAME/.zshrc"
