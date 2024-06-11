#Base image: nodejs - version: 
FROM node:18.20-alpine

#Metadata
LABEL "cl.apgca.appNode"="APC"
LABEL maintainer="brianpericon.e92@gmail.com"
LABEL version="0.1"

#Setting enviroment variables
ENV HOME=/opt/app 
ENV PORT=8080

#Setting work directory
WORKDIR $HOME

#Install dependencies from package.json
COPY package.json $HOME
COPY package-lock.json $HOME
RUN npm install --quiet

#Install globally nodemon to watch changes on realtime
RUN npm install nodemon -g --quiet

#Copy app
COPY jest.config.js $HOME
COPY jest.setup.js $HOME
COPY sonar-project.properties $HOME
COPY src/ $HOME/src
COPY tsconfig.json $HOME
COPY .env.test $HOME

RUN chown -R daemon $HOME
USER daemon

#Expose port 8080
EXPOSE $PORT

#Start app
CMD [ "npm", "start" ]