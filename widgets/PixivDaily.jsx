import { css } from 'uebersicht'

/*********************** Start 插件配置 ***********************/
/*********************** 下面是自定义区 ***********************/

const config = {
  mode: 1, // 1 日榜, 2 周榜, 3 月榜
  refresh: 60 * 4,
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
  POSITION: {
    x: 'left', // 显示在桌面左边还是右边，left代表左，right代表右
    y: 'top', // 显示在桌面顶部还是底部，top代表顶部，bottom代表底部
    marginX: 20, // 水平边距
    marginY: 20, // 垂直边距
  }
}

/*********************** 上面是自定义区 ***********************/
/*********************** End 插件配置 ***********************/

const modeMap = {
  1: {
    key: 'day',
    name: '日榜'
  },
  2: {
    key: 'week',
    name: '周榜'
  },
  3: {
    key: 'month',
    name: '月榜'
  }
}

const utils = {
  cdn(src) {
    return src.replace(/i.pximg.net/g, 'pximg.pixiv-viewer.workers.dev')
  },
  dateFmt(date, fmt) {
    var o = {
      "M+": date.getMonth() + 1,                 //月份 
      "d+": date.getDate(),                    //日 
      "h+": date.getHours(),                   //小时 
      "m+": date.getMinutes(),                 //分 
      "s+": date.getSeconds(),                 //秒 
      "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
      "S": date.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    }
    return fmt;
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
  const proxy = 'http://127.0.0.1:41417'
  const date = new Date()
  date.setDate(date.getDate() - 2)
  const server = 'https://hibiapi.getloli.com/pixiv/'
  const path = `?type=rank&mode=${modeMap[config.mode].key}&date=${utils.dateFmt(date, 'yyyy-MM-dd')}`
  fetch(`${proxy}/${server}${path}`)
    .then(response => {
      return response.json()
    })
    .catch(error => {
      return dispatch({ type: 'FETCH_FAILED', error: error })
    })
    .then(data => {
      const illusts = data.illusts.filter(illust => illust.type !== 'manga')
      return dispatch({
        type: 'FETCH_SUCCEDED',
        data: illusts
      })
    })
}

export const updateState = (event, previousState) => {
  if (event.error) {
    return { ...previousState, warning: `错误: ${event.error}` }
  }

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
                  Pixiv {modeMap[config.mode].name}
                  <span>每 {config.refresh / 60} 小时刷新</span>
                </h3>
              </div>
              <div className={content}>
                <div className={top3}>
                  <div className="box l">
                    <a className={imageCard} href={`https://www.pixiv.net/artworks/${data[0].id}`}>
                      <img className="image" src={`${utils.cdn(data[0].image_urls.medium)}`} />
                      <div className="meta">
                        <div className="content">
                          <h2 className="title">{data[0].title}</h2>
                          <div className="author">{data[0].user.name}</div>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="box r">
                    <div className="box t">
                      <a className={imageCard} href={`https://www.pixiv.net/artworks/${data[1].id}`}>
                        <img className="image" src={`${utils.cdn(data[1].image_urls.medium)}`} />
                        <div className="meta">
                          <div className="content">
                            <h2 className="title">{data[1].title}</h2>
                            <div className="author">{data[1].user.name}</div>
                          </div>
                        </div>
                      </a>
                    </div>
                    <div className="box b">
                      <a className={imageCard} href={`https://www.pixiv.net/artworks/${data[2].id}`}>
                        <img className="image" src={`${utils.cdn(data[2].image_urls.medium)}`} />
                        <div className="meta">
                          <div className="content">
                            <h2 className="title">{data[2].title}</h2>
                            <div className="author">{data[2].user.name}</div>
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
                <div
                  className={css`
                  margin: 10px 6px;
                `}
                >
                  {data.slice(3).map((item, i) => {
                    return (
                      <a
                        className={artItem}
                        href={`https://www.pixiv.net/artworks/${item.id}`}
                        key={i}>
                        <img
                          className={css`
                          width: 56px;
                          height: 34px;
                          margin: 0 16px 0 0;
                          object-fit: cover;
                        `}
                          src={`${utils.cdn(item.image_urls.medium)}`}
                        />
                        <div>
                          <h5>{item.title}</h5>
                          <p>{item.user.name}</p>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
      </div>
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
  width: 295px;
  height: 460px;
  overflow: hidden;
  opacity: calc(${config.theme.opacity} / 100);
  background-color: ${backgroundColor};
  padding: 24px 24px 15px 24px;
  padding-right: 10px;
  border-radius: 10px;
  color: ${fontColor};
`

const header = css`
  margin-bottom: 20px;
`

const content = css`
  height: 410px;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 4px
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px
  }
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

const imageCard = css`
position: relative;
display: flex;
justify-content: center;
align-items: center;
height: 100%;
overflow: hidden;
background: #fafafa;

&:hover{
  .image {
    width: 110%;
    height: 110%;
  }
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all .2s ease-in-out;
}

.tag-r18 {
  position: absolute;
  top: 8px;
  left: 6px;
}

.layer-num {
  position: absolute;
  top: 4px;
  right: 3px;
  background: rgba(#000, 0.3);
  color: #fff;
  padding: 4px 8px;
  font-size: 20px;
  border-radius: 20px;

  svg {
    vertical-align: bottom;
    margin-right: -2px;
  }
}

.meta {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  &::before {
    position: absolute;
    content: '';
    width: 100%;
    height: 100%;
    background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
  }

  .content {
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 12px 14px;
    box-sizing: border-box;
    color: #fff;
    font-size: 0;

    .title {
      font-size: 16px;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;

      a {
        color: #fff;
        text-decoration: none;
      }
    }

    .author {
      display: inline-block;
      font-size: 12px;
      font-weight: 200;
    }
  }
}
`

const top3 = css`
  position: relative;
  display: flex;

  .box {
    border-radius: 24px;
    overflow: hidden;
    box-sizing: border-box;

    .image-card {
      height: 100% !important;
    }
  }

  .l {
    width: 66%;
    height: 182px;
    margin-right: 10px;
  }

  .r {
    display: flex;
    flex-direction: column;
    width: 33%;
    height: 182px;

    .t {
      height: 50%;
      margin-bottom: 10px;
    }

    .b {
      height: 50%;
    }

    .meta {
      .content {
        width: 100%;
        padding: 8px 12px;
        .title {
          font-size: 12px;
        }
        .author {
          font-size: 10px;
        }
      }
    }
  }

`

const artItem = css`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
  text-decoration: unset;
  color: ${fontColor};
  -webkit-transition: all .3s;
  transition: all .3s;
  div {
    flex: 1;
  }
  h5 {
    margin: 3px 0 5px 0;
  }
  p {
    font-size: 12px;
    margin: 0;
    opacity: .6;
  }
`

const Refresh = css`
  text-align: center;
  margin-top: 12px;
  padding: 8px 0;
`

const arrowDown = css`
  display: inline-block;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid ${fontSubColor};
`

const arrowUp = css`
  display: inline-block;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid ${fontSubColor};
`
