import { css } from 'uebersicht'

/*********************** Start 插件配置 ***********************/
/*********************** 下面是自定义区 ***********************/

const config = {
  theme: {
    opacity: 90, // 插件默认透明度，可以输入 0 到 100 之间的任意数字，100 代表不透明，0 代表完全透明。
    default: 'auto', // 插件默认主题，light 代表浅色，dark 代表深色， auto 跟随系统外观
    light: {
      fontColor: 'rgba(0, 0, 0, 0.85)', // 浅色主题主标题文字颜色
      fontSubColor: 'rgba(0, 0, 0, 0.55)', // 浅色主题副标题文字颜色
      backgroundColor: `rgba(255, 255, 255, 0.85)` // 浅色主题背景颜色及透明度
    },
    dark: {
      fontColor: 'rgba(255, 255, 255, 0.85)', // 深色主题主标题文字颜色
      fontSubColor: 'rgba(255, 255, 255, 0.55)', // 深色主题副标题文字颜色
      backgroundColor: `rgba(0, 0, 0, 0.85)` // 深色主题背景颜色及透明度
    },
  },
  refresh: 30,
  POSITION: {
    x: 'left', // 显示在桌面左边还是右边，left代表左，right代表右
    y: 'top', // 显示在桌面顶部还是底部，top代表顶部，bottom代表底部
    marginX: 370, // 水平边距
    marginY: 220, // 垂直边距
  }
}

/*********************** 上面是自定义区 ***********************/
/*********************** End 插件配置 ***********************/

const weekMap = Array.from('月火水木金土日')
let now = Date.now() / 1000 | 0

const utils = {
  noreferrer() {
    const hasMeta = document.querySelector('meta[name="referrer"][content="never"]')
    if (hasMeta) return

    const meta = document.createElement('meta')
    meta.name = 'referrer'
    meta.content = 'never'
    document.head.appendChild(meta)
  },
  nanyoubi(day) {
    const index = Math.min(Math.max(0, day - 1), 6)
    return weekMap[index];
  }
}

let fontColor
let fontSubColor
let backgroundColor

if (config.theme.default === 'auto') {
  let media = window.matchMedia('(prefers-color-scheme: dark)')
  if (media.matches)
    config.theme.default = 'dark'
  else
    config.theme.default = 'light'
}

switch (config.theme.default) {
  case 'dark':
    fontColor = config.theme.dark.fontColor
    fontSubColor = config.theme.dark.fontSubColor
    backgroundColor = config.theme.dark.backgroundColor
    break
  default:
    fontColor = config.theme.light.fontColor
    fontSubColor = config.theme.light.fontSubColor
    backgroundColor = config.theme.light.backgroundColor
    break
}

export const refreshFrequency = config.refresh * 60 * 1000

export const initialState = {
  loading: true,
  data: null,
  refresh: false
}

export const command = dispatch => {
  utils.noreferrer()
  const proxy = 'http://127.0.0.1:41417/'
  fetch(`${proxy}https://bangumi.bilibili.com/web_api/timeline_global`)
    .then(response => {
      return response.json()
    })
    .catch(error => {
      return dispatch({ type: 'FETCH_FAILED', error: error })
    })
    .then(data => {
      setTimeout(() => {
        document.querySelector('#BiliBangumi-jsx .item:not(.ago)').scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 600);
      return dispatch({
        type: 'FETCH_SUCCEDED',
        data: data.result.find(item => item.is_today === 1)
      })
    })
}

export const updateState = (event, previousState) => {
  if (event.error) {
    return { ...previousState, warning: `错误: ${event.error}` }
  }

  now = Date.now() / 1000 | 0

  switch (event.type) {
    case 'FETCH_SUCCEDED':
      const { data, loading } = event
      return { ...previousState, loading, data }
    case 'REFRESH':
    case 'HIDE_MORE':
      const { refresh } = event
      return { ...previousState, refresh }
    default:
      return previousState
  }
}

export const render = ({ loading, data, refresh, error }, dispatch) => {
  return error ? (
    <div className={errorWrapper}>
      错误信息: <strong>{String(error)}</strong>
    </div>
  ) : (
      <div
        className={css`
          user-select: none;
        `}
      >
        {loading || !data ? (
          <div className={errorWrapper}>加载中...</div>
        ) : (
            <div className={wrapper}>
              <div className={header}>
                <h3 className={title}>
                  {utils.nanyoubi(data.day_of_week)}曜日放送
                  <span className={css`
                    margin-left: 3px !important;
                  `}>({data.date.replace('-', '.')})</span>
                  <span>每 {config.refresh} 分钟刷新</span>
                </h3>
              </div>
              <div className={list}
              >
                {data.seasons.map((item, i) => {
                  return (
                    <div
                      key={i}
                      className={`item ${item.pub_ts <= now ? 'ago' : ''}`}
                    >
                      <span className={css`
                        font-size: 12px;
                        color: ${fontSubColor};
                      `}
                      >
                        {item.pub_time}
                      </span>
                      <img
                        className={cover}
                        src={item.square_cover}
                      />
                      <div className={meta}
                      >
                        <div className={pubTitle}
                        >
                          <a href={`https://www.bilibili.com/bangumi/play/ss${item.season_id}`}>
                            {item.title}
                          </a>
                        </div>
                        <p className={pubIndex}
                        >
                          <a
                            className={css`
                              color: #fb7299 !important;
                            `}
                            href={`${item.pub_ts <= now ? `https://www.bilibili.com/bangumi/play/ep${item.ep_id}` : 'javascript:void(0);'}`}
                          >
                            {item.pub_index}
                          </a>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
      </div >
    )
}

export const className = `
  position: absolute;
  ${config.POSITION.x === 'left' || config.POSITION.x === 'right' ? config.POSITION.x : 'left'}:
    ${config.POSITION.marginX}px;
  ${config.POSITION.y === 'top' || config.POSITION.y === 'bottom' ? config.POSITION.y : 'top'}:
    ${config.POSITION.marginY}px;
`

const errorWrapper = css`
  font-family: Montserrat, sans-serif;
  width: 20px;
  background-color: ${backgroundColor};
  padding: 24px;
  border-radius: 10px;
  color: ${fontColor};
`

const wrapper = css`
  font-family: Montserrat, sans-serif;
  width: 320px;
  height: 260px;
  opacity: calc(${config.theme.opacity} / 100);
  background-color: ${backgroundColor};
  padding: 24px 24px 15px 24px;
  border-radius: 10px;
  color: ${fontColor};
`

const header = css`
  margin-bottom: 10px;
`

const title = css`
  display: inline-block;
  font-size: 16px;
  margin: 0;
  span {
    font-size: 12px;
    margin-left: 15px;
    font-weight: normal;
    opacity: .5;
  }
`

const list = css`
position: absolute;
overflow-y: auto;
width: 334px;
height: 230px;
padding-right: 4px;

&::-webkit-scrollbar {
  width: 4px
}

&::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px
}

.item{
  display: flex;
  justify-content: space-between;
  margin: 12px 0;
  
  &.ago{
    opacity: 0.33;
  }
}
`

const cover = css`
width: 64px;
height: 64px;
margin: 0 8px 0 10px;
object-fit: cover;
border-radius: 4px;
`

const meta = css`
display: flex;
flex-direction: column;
margin-right: auto;

a {
  color: ${fontColor};
  text-decoration: none;
}
`

const pubTitle = css`
font-size: 13px;
margin: 0;
`

const pubIndex = css`
margin: 0;
margin-top: auto;
font-size: 12px;
`