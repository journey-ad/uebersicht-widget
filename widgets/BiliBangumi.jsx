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
        const list = document.querySelector('#BiliBangumi-jsx .item:not(.ago)')
        list && list.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
              {
                data.seasons.length === 0 ? (
                  <div className={emptyList}>
                    <div className="tips">啊哦，今天好像什么都没有呢</div>
                  </div>
                )
                : (
                  <div className={list}>
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
                )
              }
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

const emptyList = css`
width: 100%;
height: 100%;
background-image: url(data:image/png;base64,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);
background-size: auto;
background-position: center 25%;
background-repeat: no-repeat;

.tips {
  padding-top: 42%;
  text-align: center;
  font-size: 16px;
  color: #595151;
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