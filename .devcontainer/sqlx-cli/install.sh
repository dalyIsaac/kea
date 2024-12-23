#!/bin/bash

# Run as the non-root user
chmod 777 ./postCreateCommand.sh
su ${_REMOTE_USER} -c 'bash postCreateCommand.sh'
