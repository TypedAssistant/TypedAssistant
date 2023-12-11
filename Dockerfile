ARG BUILD_FROM
FROM $BUILD_FROM

# Set timezone
RUN cp /usr/share/zoneinfo/Europe/London /etc/localtime \
    && echo "Europe/London" > /etc/timezone
ENV TZ=Europe/London

# Create retry function in case of spotty internet
RUN { \
        echo 'retry() {' ; \
        echo '  local cmd="$@"' ; \
        echo '  local attempt_num=1' ; \
        echo '  until $cmd; do' ; \
        echo '    if (( attempt_num == 5 )); then' ; \
        echo '      echo "Attempt $attempt_num failed! Exiting."' ; \
        echo '      exit 1' ; \
        echo '    fi' ; \
        echo '    echo "Attempt $attempt_num failed! Retrying in 5 seconds..."' ; \
        echo '    sleep 5' ; \
        echo '    attempt_num+=1' ; \
        echo '  done' ; \
        echo '}' ; \
    } > /usr/local/bin/retry.sh && chmod +x /usr/local/bin/retry.sh


COPY run.sh /

RUN echo "${ALPINE_MIRROR}/v3.18/main/" >> /etc/apk/repositories
RUN . /usr/local/bin/retry.sh && retry apk add build-base git jq krb5-dev libsecret-dev make npm nodejs --repository="http://dl-cdn.alpinelinux.org/alpine/v3.18/main/"
# RUN npm install -g n
# RUN n 18
# RUN hash -r
# RUN node --version

RUN apk --no-cache add ca-certificates wget
RUN . /usr/local/bin/retry.sh && retry wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
RUN . /usr/local/bin/retry.sh && retry wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk
RUN apk update
RUN apk add --no-cache --force-overwrite glibc-2.28-r0.apk 
RUN apk add --no-cache --force-overwrite libstdc++-dev
RUN find / -name 'libstdc++.so.6'
# RUN ldd $(which node)

# Install VSCode server
# RUN . /usr/local/bin/retry.sh && retry curl -fsSL https://code-server.dev/install.sh | sh
# Set the code-server port
EXPOSE 8080
# Run code-server in /run.sh

COPY . /TypedAssistant/
WORKDIR /TypedAssistant

RUN . /usr/local/bin/retry.sh && retry npm install -g bun

# Run bun install in the /src directory
# RUN . /usr/local/bin/retry.sh && retry bun install

# Make sure run.sh is executable
RUN chmod a+x /run.sh
ENV SUPERVISOR_TOKEN=$SUPERVISOR_TOKEN

CMD [ "/run.sh" ]
