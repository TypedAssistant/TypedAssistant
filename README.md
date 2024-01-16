# TypedAssistant

## Installation

- Copy the URL of this GitHub repo.
- Go to the Home Assistant Add-ons store.
- Add the copied URL to the add-on repository list. It should soon appear in the add-on store.
- Install the add-on.
- Once installation has finished, fill in the configuration.
- Start the add-on. A folder called /addons/TypedAssistant will be created.

## Syncing with GIT

To enable syncing with a GitHub repository, you can provide the following environment variables:

- `GITHUB_TOKEN`: Your GitHub personal access token with the necessary permissions to access the repository.
- `GITHUB_USERNAME`: Your GitHub username.
- `GITHUB_REPO`: The name of the repository to sync with.
- `GITHUB_BRANCH`: The branch to use for syncing.

Please note that the repository should be initially empty unless you have already been through the setup process. When the add-on is first run, it will initialize the repository with template code. If the repository has been initialized before, the add-on will use those existing files, keeping everything in sync.

### GitHub webhooks

By default, the add-on will poll the provided GitHub repo for changes every 30 seconds (configurable in process.tsx). However, we can instead provide an external URL (e.g. the Nabu Casa remote access URL) in the add-on configuration page. When provided, the add-on will automatically setup a webhook for the given repo, so that when you push changes to it, they will be pulled and loaded automatically.

## SSHing into docker

- We can use the [SSH & Web Tunnel](/https://community.home-assistant.io/t/home-assistant-community-add-on-ssh-web-terminal/33820) to find our docker container and ssh into it
  - Once installed, open the Terminal add-on and run `docker ps | grep TypedAssistant`. Hopefully an entry should appear. If not, make sure the TypedAssistant add-on is installed and running.
  - Run `docker exec -it <docker id from previous command> /bin/bash`. You should now be inside the docker container.

