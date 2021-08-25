import { css } from 'uebersicht';

export const config = { }

export const refreshFrequency = 60 * 60 * 1000

export const initialState = {
  _name: 'unique-instance'
}

export const command = dispatch => {
  return dispatch({
    type: 'OK'
  })
}

export const updateState = (event, previousState) => {
  window.uniqueInstanceHelper = initialState

  return previousState
}

export const render = _ => {
  return (
    <div className={css`
    display: none;
  `}></div >
  )
}
