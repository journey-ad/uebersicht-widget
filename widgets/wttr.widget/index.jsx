import { css } from 'uebersicht'

//
// Shows the current wttr.in forecast on your desktop
//
//
//Change language and city with the two parameter below.
//check http://wttr.in/:translation for a list of available languanges.
//
//

export const lang = "zh";
export const city = "ShangHai";

export const refreshFrequency = 1000 * 60 * 30 // 30min

export const className = `
  // position on screen
  left: 370px;
  top: 20px;

  position: fixed;
  -webkit-font-smoothing: antialiased; // nicer font rendering
  color: #efefef;

  pre {
    display: inline-block;
    margin: 0;
  }

  .block-0 {
    font: 5px "DejaVu Sans Mono", Menlo, "Lucida Sans Typewriter", "Lucida Console", monaco, "Bitstream Vera Sans Mono", monospace;
    width: 45%;
  }

  .block-1 {
    font: 12px "DejaVu Sans Mono", Menlo, "Lucida Sans Typewriter", "Lucida Console", monaco, "Bitstream Vera Sans Mono", monospace;
    margin: -20px 0 0 0;
    width: 55%;
  }

  .block-2 {
    display: block;
    width: 100%;
    font: 12px "DejaVu Sans Mono", Menlo, "Lucida Sans Typewriter", "Lucida Console", monaco, "Bitstream Vera Sans Mono", monospace;
    line-height: 12px;
    margin-top: -6px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

`;

export const command = `
  cd wttr.widget &&
  curl -s wttr.in/moon?lang=${lang} |
  ./terminal-to-html&&
  echo "__BLOCK__" &&
  curl -s ${lang}.wttr.in/${city}\?0tq |
  ./terminal-to-html&&
  echo "__BLOCK__" &&
  curl -sL https://v1.hitokoto.cn/?encode=text |
  ./terminal-to-html
`;


export const render = props => props.error ? props.error :
  <div
    className={css`
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      align-items: center;
      width: 370px;
      height: 178px;
      padding: 8px 10px;
      background: rgba(0, 0, 0, .8);
      border-radius: 12px;
      box-sizing: border-box;
    `}>
    <link rel="stylesheet" href="wttr.widget/terminal-colors.css" />
    {props.output.split('__BLOCK__').map((item, i) => {
      return (
        <pre
          className={`block-${i}`}
          dangerouslySetInnerHTML={{
            __html: item.split('\n').slice(0, 24).join('\n')
          }}
          key={i}
        />
      )
    })}
  </div>


render: out => `
  <link rel="stylesheet" href="wttr.widget/terminal-colors.css" />
  <pre>${out.err || out.data.split('\n').slice(1, 7).join('\n')}</pre>
`