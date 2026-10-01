# TASK ID: MODULE-001.2
# TITLE: Add module WIT (WebAssembly Interface Types) definitions
# STATUS: pending
# DEPENDENCIES: MODULE-001.1
# ALLOWED FILES: product/packages/module-sdk/wit/product.wit
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the WIT world that modules implement.

## REQUIRED IMPLEMENTATION

Create `product/packages/module-sdk/wit/product.wit`:

```wit
package product:module@0.1.0;

interface types {
    record command {
        id: string,
        command-type: string,
        aggregate-type: string,
        aggregate-id: string,
        actor-user-id: string,
        device-id: string,
        correlation-id: option<string>,
        payload: string, // JSON-encoded
    }

    record event {
        id: string,
        event-type: string,
        aggregate-type: string,
        aggregate-id: string,
        version: s64,
        occurred-at: string,
        payload: string, // JSON-encoded
    }

    record query {
        id: string,
        query-type: string,
        payload: string,
    }

    record command-outcome {
        events: list<event>,
        response: string, // JSON-encoded
    }

    record query-outcome {
        response: string,
    }
}

interface host {
    log: func(level: string, message: string);
    now-iso8601: func() -> string;
    uuid-v7: func() -> string;
    read-projection: func(table: string, key: string) -> option<string>;
    write-audit: func(action: string, target-type: string, target-id: string, details: string) -> result<_, string>;
}

world handler {
    import host;
    export handle-command: func(cmd: command) -> result<command-outcome, string>;
    export handle-query: func(q: query) -> result<query-outcome, string>;
}
```

## TESTS

```bash
cd product
test -f packages/module-sdk/wit/product.wit || { echo "FAIL"; exit 1; }
grep -q "world handler" packages/module-sdk/wit/product.wit || { echo "FAIL: no world"; exit 1; }
grep -q "import host" packages/module-sdk/wit/product.wit || { echo "FAIL: no host import"; exit 1; }
echo "OK"
```
