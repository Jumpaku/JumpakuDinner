# Jumpaku Dinner

https://dinner.jumpaku.net

## Environments

| environment | default         | required | description |
|-------------|-----------------|----------|-------------|
|`SERVER_NAME`| `localhost`     | no       | value of ServerName of httpd |

## Example

Execute `docker-compose up` with the following `docker-compose.yml` and open `localhost:8080`.

```yml
version: '3'

services: 

  jumpaku-dinner:
    container_name: 'jumpaku-dinner'
    image: 'jumpaku/jumpaku-dinner'
    restart: 'always'
    environment: 
        - 'SERVER_NAME=localhost'
    ports:
        - '8080:80'
```

