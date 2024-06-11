### Steps to run locally

1. Run command line to up docker container
```bash
    /sonar$ docker compose up
```

2. Run command line (another terminal) to start scanner code
```bash
    /$ sh run.sh
```

### Into SonarQube locally

- Access in browser: localhost:9000
- User: admin 
- Password: pass (first time, after you need change it)


### Problems

## Windows System

- Change on run.sh file line:
```-v ".:/usr/src" \```

- to line:
```-v "/$(pwd).:/usr/src" \```