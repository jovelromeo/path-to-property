# Path to property
Repo: https://github.com/jovelromeo/path-to-property

## Usage
This tiny library consists of only one exported method wich accepts an object and a string.
```js
    const pathToProperty = requre('path-to-property');
    const obj = {
        redjar: {
            'countries.info': {
                [
                    { country:'ARG', values: ['good', 'peaple'] },
                    { country:'SV', values: ['also','good', 'peaple']}
                ]
            }
        }
    }; 
    const path = 'redjar."conutries.info".[country:ARG].values.0';
    const desiredProperty = pathToProperty(obj, path); 
    console.log(desiredProperty); // 'good'
```
The path would be equivalent to doing as follows
```js
    obj.redjar['countries.info'].find(x=>x.country === 'ARG').values[0] // 'good'
```
## Path posibilities
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
 If you need to find an object you must provide a key and a values to find. **If the value is a number or a boolean it is converted to string before the comparison.**
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
  you can also use quotes for the filter key as 'n.id' wich is executed this way: [..] .filter(x=>x['n.id'] === <value>) [..]
  
  if you dont use quotes and the key has dots as in n.id it wil executed this way: [..] .filter(x=>x.n.id === <value>) [..]
```

## A simple alternative
*Need a simpler alternative? Use this: 
```js
    const obj = {/*your data*/};
    const keys = path.split('.');
    let desiredProp = obj;
    for (const key of keys) {
        desidedProp = desiredProp[key];
    }
    console.log(desiredProp); // path value
```

Fell free to add issues or make some improvements.

Hope this can help, probably for defining the same logic to find a value from different data providers and structures.

Buy me coffe:
- BTC: 3PXTqzvQFucGMy71vmyYFwnTKmQCAYKozj
- LTC: M8ZB5F3xVK1gnCUiJaRUe6jkR8RdEa9TPZ 