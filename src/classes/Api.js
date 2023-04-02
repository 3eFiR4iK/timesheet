/* eslint-disable */
Array.prototype.del = function(index, count = 1) {
    return [].concat(this).slice(0, index).concat(this.slice(index + count));
};


const BX24 = window.BX24

// COMMON
export function resizeWindow() {
    const size = BX24.getScrollSize();
    if (document.body.scrollHeight < size.scrollHeight) {
        BX24.resizeWindow(size.scrollWidth, document.body.scrollHeight < 800 ? 800 : document.body.scrollHeight);
        setTimeout(BX24.fitWindow, 500);
    }
    else {
        BX24.fitWindow();
    }
}

export function getUserDisplayName(user, variant) {

    if (!user) {
        return "user is undefined";
    }

    switch (variant) {
        case "short": return `${user['LAST_NAME']} ${user['NAME'][0]}.`;
        default: return `${user['LAST_NAME']} ${user['NAME']}`;
    }
}

export const storageApi = {
    save: (key, data) => {
        const resultData = typeof data === "object" ? JSON.stringify(data) : data;
        localStorage.setItem(key, resultData);
    },
    update: (key, data) => {
        const storageData = localStorage.getItem(key);
        const oldData = storageData !== null ? JSON.parse(storageData) : {};
        localStorage.setItem(key, JSON.stringify(Object.assign({}, oldData, data)));
    },
    get: (key, defaultData = {}) => {
        const data = localStorage.getItem(key);
        return data === null ? defaultData : JSON.parse(data);
    }
};

export function getDevice() {
    return isMobile() ? "mobile" : "desktop";
}

export function isMobile(deviceType) {
    if (Array.isArray(deviceType)) {
        for (let type of deviceType) {
            if (!isMobile(type)) {
                return false;
            }
        }
        return true;
    }

    switch (deviceType) {
        case "android": return !!~navigator.userAgent.search(/Android/i);
        case "ios": return !!~navigator.userAgent.search(/iPhone|iPad|iPod/i);
        case "blackberry": return !!~navigator.userAgent.search(/BlackBerry/i);
        case "opera": return !!~navigator.userAgent.search(/Opera Mini/i);
        case "windows": return !!~navigator.userAgent.search(/IEMobile/i);
        default:
            return isMobile('android') ||
                isMobile('ios') ||
                isMobile('blackberry') ||
                isMobile('opera') ||
                isMobile('windows');
    }
}

export function getGridSize(size) {
    return typeof size === "object" ? size:
        size <= 12 || size === "auto" ? {xs: size}: {}
}

export function select(selected, id) {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
            selected.slice(0, selectedIndex),
            selected.slice(selectedIndex + 1),
        );
    }
    return newSelected;
}

export function logState(state) {
    console.log("%cSTATE %o", "color:#a0e8b0; font-size:20px", state);
}

export function convertDataToList(data) {
    return data.allIds.map( id => data.byId[id] );
}

export function updateObject(targetObject, object) {
    const result = Object.assign({}, targetObject);

    for (let key of Object.keys(object)) {
        const propValue = object[key];
        result[key] = typeof propValue === 'object' && !Array.isArray(propValue) ?
            updateObject(targetObject[key], propValue):
            propValue
    }

    return result;
}

// REQUESTS
export function callBatch(requests, batchTitle = false) {
    return Object.keys(requests).length === 0 ?
        Promise.resolve({}):
        new Promise( resolve => {
            BX24.callBatch(requests, result => {
                if (batchTitle) {
                    console.log(result, batchTitle);
                }
                resolve(result);
            });
        });
}

export function callStepBatch(requests, byStep = 50, callback) {
    if (callback && typeof callback !== 'function') {
        throw new Error('callback is not a function (callStepBatch)');
    }

    if (Object.keys(requests).length === 0) {
        return Promise.resolve();
    }

    const sRequests = splitByStep(requests, byStep);
    let step = 0;

    function doStep() {
        const requestsByStep = sRequests[step];
        return callBatch(requestsByStep).then( response => {
            if (callback) {
                callback(response);
            }
            return !sRequests.hasOwnProperty(++step) ? Promise.resolve() : doStep();
        })
    }
    return doStep();
}

export function callStepByStep(promises = [], callback) {
    if (!Array.isArray(promises)) {
        return Promise.resolve();
    }
    if (promises.length === 0) {
        return Promise.resolve();
    }

    let step = 0;
    function doStep(promise) {
        return promise().then( response => {
            if (typeof callback === 'function') {
                callback(response);
            }

            return promises.length > ++step ?
                doStep(promises[step]):
                Promise.resolve();
        });
    }
    return doStep(promises[step]);
}

export function callMany(requests, callback) {
    const keys = Object.keys(requests);
    if (keys.length === 0) {
        return Promise.resolve();
    }

    const result = {};
    let promises = [];

    for (let key of Object.keys(requests)) {
        promises.push(() => {
            const request = requests[key];

            return request.handler(result)
                .then( response => {
                    result[key] = response;

                    if (typeof callback === 'function') {
                        callback(response, request)
                    }
                    return Promise.resolve();
                })
        });
    }
    return callStepByStep(promises)
        .then( () => Promise.resolve(result) );
}

export function splitByStep(object, byStep = 50) {
    const result = {};
    let step = 0, stepData = {}, counter = 0;

    for (let key of Object.keys(object)) {
        stepData[key] = object[key];
        if (++counter === byStep) {
            counter = 0;
            result[step++] = stepData;
            stepData = {};
        }
    }

    if (counter !== 0) {
        result[step] = stepData;
    }
    return result;
}

export function normalizeData(items) {
    const result = {};
    let ids = [];

    for (let item of items) {
        const id = item.ID || item.id;
        result[id] = item;
        ids.push(id);
    }
    return {byId: result, allIds: ids};
}

export function getDeleteRequests(entity, items = [], getId) {
    const requests = {};
    for (let item of items) {
        const id = getId(item);
        requests[`delete-${entity}-${id}`] = ['entity.item.delete', {ENTITY: entity, id}]
    }
    return requests;
}

// NUMBERS
export function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

export function isInteger(num) {
    return  (num ^ 0) === num;
}

export function normalizeNumber(num, precision = 2) {
    return isInteger(num) ? num : parseFloat(num.toFixed(precision));
}

// INSTALL API
export const getEntityInstallRequests = entities => {
    const requests = {};
    for(let entity of entities) {
        requests[entity.ENTITY_CODE] = [
            'entity.add',
            {
                ENTITY: entity.ENTITY_CODE,
                NAME: entity.NAME,
                ACCESS: {AU: 'X'}
            }
        ]
    }
    return requests;
};

export function getAddPropsRequests(propsOptions) {
    let requests = {};
    for (let options of propsOptions) {
        const entityRequests = generateAddEntityPropsRequests(options.ENTITY_CODE, options.PROPS);
        requests = Object.assign({}, requests, entityRequests);
    }
    return requests;
}

export function generateAddEntityPropsRequests(entity, props) {
    const requests = {};
    for (let propKey of Object.keys(props)) {
        const requestKey = `${entity}_${propKey}`;
        const prop = props[propKey];
        requests[requestKey.toLowerCase()] = ['entity.item.property.add',
            {
                ENTITY: entity,
                PROPERTY: propKey,
                NAME: prop.NAME || propKey,
                TYPE: prop.TYPE || "S"
            }
        ];
    }
    return requests;
}

export function generateAddItemsRequests(entity, items) {
    let requests = {}, counter = 1;
    for (let item of items) {

        const requestCode = `${entity}-add-${counter++}`;
        const params = {
            ENTITY: entity,
            NAME: item.NAME,
            CODE: item.CODE || "",
            DETAIL_TEXT: item.VALUE || "",
            PROPERTY_VALUES: {}
        };

        if (item.PROPS) {
            for (let key of Object.keys(item.PROPS)) {
                params.PROPERTY_VALUES[key] = item.PROPS[key];
            }
        }

        requests[requestCode] = ['entity.item.add', params];
    }
    return requests;
}

export function getAddItemsRequests(itemsOptions) {
    let requests = {};
    for (let options of itemsOptions) {
        const entityRequests = generateAddItemsRequests(options.ENTITY_CODE, options.ITEMS);
        requests = Object.assign({}, requests, entityRequests);
    }
    return requests;
}
