export function logError(err) {
    console.error('CODE', err.code, 'MESSAGE', err.message)
    console.error(err)
}

export function logData(...args) {
    console.log(...args)
}
