# ms-srt-wallet microservice

A sample microservice generated by [Node Bootstrap](http://nodebootstrap.io)

## Developing code in local workspace

**Please note:** we follow the philosophy of clean separation between "build"
and "run" stages.

In the build stage, the `Dockerfile` is used to build the container image and
bring it to a state where it can be run by any execution environment (such as:
Swarm, Kubernetes, ECR, etc.) given that the environment will also contextualize
it using appropriate environmental variables.

In the run stage execution environment runs the container image built by the
Dockerfile. For local development docker-compose.yml takes the role of the
executor. it is the simplest solution for the task and we prefer keeping things
simple, locally.

Please note that in the local environment code hot-reloading is turned on, so
there is no need to restart the container as you develop code, just edit the
corresponding files and enjoy the experience!

## Run/Stop container:

```
# run:
> make [start]

# stop:
> make stop

# clean rebuild:
> make clean
```

Inspecting health of the containers:

```
> make ps
```

## Monitoring Logs:

```
> make logs
```

## Debugging

To shell into the container, simply run:

```
> make shell
```


## Running tests:

```
> make test
```
Coverage reports are stored under `coverage` sub-folder.

## Installing a new package

Installing a package (let's assume for package `maikai`):

```
make add package=maikai
```

Install a package in dev-dependencies (let's assume for package `mocha`):

```
make add-dev package=mocha
```

If you add a number of packages in package.json manually (e.g. on the host),
you generally want to run `make build` to rebuild the container or run
`make clean` to stop, rebuild and start.

## Database Migrations (Currently: MySQL)

```
# Create migration:
> make migration-create name=<migration-name>
# e.g.:
> make migration-create name=create-wallet-table
# Run migrations:
> make migrate
```

## Accessing the microservice:

http://localhost:5501/

## Running Automated Tests

Run: `make test`

## License

[MIT](LICENSE)
