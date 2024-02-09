# TODO

- [ ] Get exoplanet running
- [ ] Add more tests
- [ ] Check for vscode add-on and add link to it
- [ ] Call API through websocket when available
- [ ] Take screenshots
- [ ] Remove stuff about webhooks
- [ ] Update changelogs
- [ ] Update READMEs
- [ ] Do more in github actions

# TypedAssistant

An alternative to low-code automation systems like Node Red, or Home Assistant's own automation builder.

## Warning

This add-on is for **developers**, and people that have good knowledge of TypeScript and Bun/Node. React knowledge is required too, if you go down that route.

Please file issues for bugs, and MRs are open and welcome.

## Bun ❤️

We use Bun and therefore all Bun apis are available, e.g. bun:sql and $.

## Workflow 

### With Github integration

- Install the add-on
- Create a repository in Github. Add your git details to the add-on configuration.
- When the add-on runs, it will automatically setup a Github webhook (if you provide an external URL in the add-on configuration) or start polling for changes every 30 seconds.
- When a change is detected in the remote repo, your app will be restarted automatically.
- You can work on the repo locally, then push to remote. Alternatively, you can press "." on the repo's page on github.com to open the in-browser editor where you can make changes and commit directly.

### Working on the repo locally

- Clone your new Github repo and cd in.
- Add a `.env.local` file to the root of the project. Include your Hass URL and token, e.g.:
  ```
  HASS_SERVER=http://192.168.86.10:8123
  HASS_TOKEN=xxxxx.yyyyy.zzzzz-00000
  ```
- Run `bun i` to install dependencies.
- Run `bun gen:types` to generate various types from your HA instance.
- Run `bun ./src/process.tsx` to start the server. Have fun!


### Without Github integration

- Install the add-on
- A template is created in the addon_configs directory of Home Assistant
- When a change is detected in this folder, your app will be restarted automatically.
- You can access this directory in many ways, including the following Home Assistant add-ons:
  - Visual Studio Code,
  - Samba share
  - SSH Terminal

## React

Ink, a react renderer for the CLI, can be used to build out your home automations. This brings the benefits of React, like components and state management.

### But I don't like React!

TypedAssistant provides some utilities for React, but you can use as much or as little react as you wish. At the heart of things, this add-on provides a bun server that can be used with any tooling you desire.

## Benefits

- Type-safety and autocompletions
- Write tests for your trickier automations.

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

## ENV variables

You can change these in the add-on configuration.

`LOCALE`: Used for logging dates. Default is "en-GB".