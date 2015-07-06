# MAPI

This is a simple mock api.

# Installing

Simply run

```
npm install mapi -g
```

# Usage

You need to create your own JSON fixture file in following format

```
{
 "URL": {
  "METHOD": {
    "response": // your response,
    "status": STATUS_CODE // 200 by default
  }
 }
}
```

When you created the file, just point it to mapi

```
mapi fixtures.json
```

It will start an api server on your local host simply visit http://localhost:9000/_mapi/ and see the parsed fixtures file.

You can also configure it to run on different port by providing port number after the fixture file

```
mapi fixtures.json 8080
```

Will run the app on port 8080