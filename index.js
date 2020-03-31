import { addPlugin } from 'react-native-flipper'

export default () => {
  let storeInstance = null
  let connectStatus = false
  let connectionInstance = null
  addPlugin({
    getId () {
      return 'flipper-plugin-rn-redux-inspector'
    },
    onConnect (connection) {
      connectStatus = true
      connectionInstance = connection
      // request initial state
      connection.receive('dispatch', (action, responder) => {
        if (storeInstance) {
          storeInstance.dispatch(action)
        }
        responder.success()
      })
    },
    onDisconnect () {
      connectionInstance = null
      connectStatus = false
    }
  })
  const logAction = ({ action, prevState, nextState }) => {
    if (connectStatus && connectionInstance) {
      const id = Date.now()
      connectionInstance.send('action', {
        timeStamp: id,
        uniqueId: id,
        actionType: action.type,
        payload: action.payload,
        action,
        prevState,
        nextState
      })
    }
  }
  return store => {
    if (typeof store.dispatch !== 'function' || typeof store.getState !== 'function') {
      return console.error(`
      [rn-redux-middleware-flipper] INVALID INPUT
      `)
    }
    return next => action => {
      storeInstance = store
      let result
      try {
        const prevState = store.getState()
        result = next(action)
        logAction({
          action,
          prevState,
          nextState: store.getState()
        })
      } catch (err) {
      }
      return result
    }
  }
}
