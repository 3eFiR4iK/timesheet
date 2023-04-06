/* eslint-disable */
import {callBatch, callStepBatch, normalizeData} from "./Api";
import { entityCode, tsListId, taskIdFieldName } from "@/config";

export class Bitrix24 {
    static getDomain() {
        return window.BX24.getDomain();
    }

    static isAdmin() {
        return window.BX24.isAdmin();
    }

    static reloadWindow() {
        window.BX24.reloadWindow();
    }

    static getInfo() {
        return this.callMethod('app.info');
    }

    static getPlacementInfo() {
        return window.BX24.placement.info()
    }

    static getUserLink(id) {
        return `https://${Bitrix24.getDomain()}/company/personal/user/${id}/`;
    }

    static getDepartmentLink(id) {
        return `https://${Bitrix24.getDomain()}/company/structure.php?set_filter_structure=Y&structure_UF_DEPARTMENT=${id}`;
    }

    static getCurrentUser() {
        return this.callMethod('user.current');
    }

    static loadUsers(normalize) {
        return this.callListMethod('user.get', {FILTER: {ACTIVE: true, USER_TYPE: 'employee'}})
            .then( users => {
                return normalize ?
                    Promise.resolve(normalizeData(users)):
                    Promise.resolve(users);
            });
    }
    static notifyUser(userId, message, type = "SYSTEM") {
        return this.callMethod('im.notify', {to: userId, message, type});
    }
    static callMethod(method, params = {}, callback) {
        return new Promise( (resolve, reject) => {
            window.BX24.callMethod(method, params,
                response => {
                    const errorObject = response.error();
                    if (errorObject) {
                        reject(errorObject);
                    }
                    else {
                        if (typeof callback === 'function') {
                            callback(response);
                        }
                        resolve( response );
                    }
                }
            );
        })
    }


    static loadPackage(method, params, packageNumber, callback) {

        if (+packageNumber > 0) {
            params.start = packageNumber * 50;
        }
        return callBatch({'get_data': [method, params]})
            .then( response => {
                const reqResponse = response['get_data'];

                if (typeof callback === 'function') {
                    callback(reqResponse);
                }

                return Promise.resolve(reqResponse);
            });
    }

    static callListMethod(method, params = {}, callback) {

        function constructResponse(response) {
            return {
                total: () => response.total,
                data: () => response.items,
                error: () => response.error
            }
        }

        return new Promise( (resolve, reject) => {
            Bitrix24.callMethod(method, params)
                .then( response => {
                    let errorObject = response.error();
                    if (errorObject) {
                        reject(errorObject);
                    }
                    else {
                        const total = response.total();
                        let items = method === 'tasks.task.list' ? response.data().tasks : response.data();

                        if (total < 50 || !total) {
                            if (typeof callback === 'function') {
                                callback(response);
                            }

                            const customResponse = {
                                total,
                                items,
                                error: errorObject
                            };
                            resolve(constructResponse(customResponse));
                        }
                        else {
                            const requests = {};
                            const steps = Math.ceil(total / 50);
                            let step = 1;

                            while (step < steps) {
                                const stepParams = Object.assign({}, params);
                                stepParams['start'] = step * 50;
                                requests[step] = [method, stepParams];
                                step++;
                            }
                            return callStepBatch(requests, 25, response => {
                                for (let rKey of Object.keys(response)) {

                                    if (typeof callback === 'function') {
                                        callback(response);
                                    }

                                    const requestResponse = response[rKey];
                                    const [method, params] = requests[rKey];

                                    errorObject = requestResponse.error();
                                    if (errorObject) {
                                        reject(errorObject);
                                    }
                                    else {
                                        const result = method === 'tasks.task.list' ? requestResponse.data().tasks : requestResponse.data();
                                        items = items.concat(result);
                                    }
                                }
                            }).then( () => {
                                const customResponse = {
                                    total,
                                    items,
                                    error: errorObject
                                };
                                return resolve(constructResponse(customResponse));
                            });
                        }
                    }
                }
            );
        })
    }

    static addTs(taskId, tsId) {
        return new Promise( (resolve, reject) => {
            Bitrix24.callMethod('tasks.task.get', {
                taskId: taskId,
                select: ['ID', 'UF_CRM_TASK']
            }).then(response => {
                const crmElems = response.answer.result.task.ufCrmTask;
                let params = {}

                params[taskIdFieldName] = taskId
                if (crmElems) {
                    for (let crmElem of crmElems) {
                        if (crmElem.indexOf('CO_') === 0) {
                            params['companyId'] = crmElem.substr(3)
                            break
                        }
                    }
                }

                Bitrix24.callMethod('crm.item.update', {
                    entityTypeId: tsListId,
                    id: tsId,
                    fields: params
                }).then(response => {
                    return resolve(response)
                })
            }).catch((response) => {
                return reject(response)
            })
        })
    }
}
