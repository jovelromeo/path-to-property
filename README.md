# Path to property
Repo: https://github.com/jovelromeo/path-to-property
NPM: https://www.npmjs.com/package/advanced-get-value

## Usage
This tiny library consists of only one exported method which accepts an object and a string.
```js
    const pathToProperty = require('path-to-property');
    const obj = {
        redjar: {
            'countries.info': [
                { country:'ARG', values: ['good', 'people'] },
                { country:'SV', values: ['also','good', 'people']}
            ]
        }
    }; 
    const path = 'redjar."countries.info".[country:ARG].values.0';
    const desiredProperty = pathToProperty(obj, path); 
    console.log(desiredProperty); // 'good'
```
The path would be equivalent to doing as follows
```js
    obj.redjar['countries.info'].find(x=>x.country === 'ARG').values[0] // 'good'
```

## Handling Non-Existent Paths
This example shows how to handle cases where the specified path does not exist in the object.
```js
const pathToProperty = require('path-to-property');
const obj = {
    person: {
        name: 'Alice',
        age: 30
    }
};
const path = 'person.address.street';
let desiredProperty;
try {
    desiredProperty = pathToProperty(obj, path);
    console.log(desiredProperty);
} catch (error) {
    console.log('Path does not exist, using default value:', 'Unknown Street');
    desiredProperty = 'Unknown Street';
}
// Output: 'Path does not exist, using default value: Unknown Street'
```

## Path possibilities
The path string is defined with the properties key (or array find key:value) separated by a colon.
- Keys with dots: 
 If a key contains a colon wrap it into double or single quotes.
```js
E.g.
    path = 'child1."child1.2".name';
    obj = {
        child1: {
            'child1.2': {
                name: 'Rojo'
            }
        }
    };
    const desiredProperty = pathToProperty(obj, path); // obj.child1['child.2'].name
    console.log(desiredProperty); // Rojo

```
- Condition for find in an array: 
 If you need to find an object you must provide a key and a value to find. **If the value is a number or a boolean it is converted to string before the comparison.**
```js
E.g.
    path = 'child1.[id:child1.2].name';
    obj = {
        child1: [
            {
                id: 'child1.2',
                name: 'Rojo'

            }
        ]
    };
    const desiredProperty = pathToProperty(obj, path); 
    // obj.child1.find(x=>x.id==='child1.2').name
    console.log(desiredProperty); // Rojo
/*
  you can also use quotes for the filter key as 'n.id' which is executed this way: [..] .filter(x=>x['n.id'] === <value>) [..]
  
  if you don't use quotes and the key has dots as in n.id it will executed this way: [..] .filter(x=>x.n.id === <value>) [..]
```

## A simple alternative
*Need a simpler alternative? Use this: 
```js
    const obj = {/*your data*/};
    const keys = path.split('.');
    let desiredProp = obj;
    for (const key of keys) {
        desiredProp = desiredProp[key];
    }
    console.log(desiredProp); // path value
```

Feel free to add issues or make some improvements.

Hope this can help, probably for defining the same logic to find a value from different data providers and structures.

Buy me coffee:
- BTC: 3PXTqzvQFucGMy71vmyYFwnTKmQCAYKozj
- LTC: M8ZB5F3xVK1gnCUiJaRUe6jkR8RdEa9TPZ 
