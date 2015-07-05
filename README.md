# MAPI

This is a simple mock api.

# Installing

Simply run

```
npm install mapi
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

It will start an api server simply visit and see the results
