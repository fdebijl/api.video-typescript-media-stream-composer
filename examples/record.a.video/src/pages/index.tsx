import { MediaStreamComposer, MouseTool, StreamDetails } from '@api.video/media-stream-composer'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import AspectRatioIcon from '@mui/icons-material/AspectRatio'
import DeleteIcon from '@mui/icons-material/Delete'
import StartRecordingIcon from '@mui/icons-material/FiberManualRecord'
import GestureIcon from '@mui/icons-material/Gesture'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp'
import StopRecordingIcon from '@mui/icons-material/StopCircle'
import { FormControl, FormGroup, FormLabel, Menu, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, ToggleButton, ToggleButtonGroup } from '@mui/material'
import Button from '@mui/material/Button'
import { createTheme } from '@mui/material/styles'
import PopupState from 'material-ui-popup-state'
import {
  bindMenu, bindTrigger
} from 'material-ui-popup-state/hooks'
import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import { CirclePicker } from 'react-color'
import styles from '../../styles/Home.module.css'
import StreamDialog, { StreamFormValues } from '../components/StreamDialog'

const theme = createTheme({
  palette: {
    primary: {
      light: '#757ce8',
      main: '#FA5B30',
      dark: '#FF6B40',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
    success: {
      main: '#0b0f17',
      dark: '#414f6e',
    }
  },
});

const WIDTH = 1024;
const HEIGHT = 768;
const UPLOAD_TOKEN = process.env.NEXT_PUBLIC_UPLOAD_TOKEN;

const composer = (() => {
  const mediaStreamComposer = new MediaStreamComposer({
    resolution: {
      width: WIDTH,
      height: HEIGHT
    }
  });

  mediaStreamComposer.setMouseTool("move-resize");
  mediaStreamComposer.setDrawingSettings({
    color: "#ff0000",
    lineWidth: 6,
    autoEraseDelay: 2
  });
  return mediaStreamComposer;
})();


const Home: NextPage = () => {
  const [addStreamDialogIsOpen, setAddStreamDialogOpen] = useState(false);

  const [streams, setStreams] = useState<StreamDetails[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [mouseTool, setMouseTool] = useState<MouseTool>("move-resize");
  const [devices, setDevices] = useState<InputDeviceInfo[]>([]);

  const [drawingColor, setDrawingColor] = useState("#ff6900");
  const [drawingAutoEraseDelay, setDrawingAutoEraseDelay] = useState(0);


  // update the drawing settings when related states are changed
  useEffect(() => {
    if (composer) {
      composer.setDrawingSettings({
        color: drawingColor,
        lineWidth: 6,
        autoEraseDelay: drawingAutoEraseDelay,
      });
    }
  }, [drawingColor, drawingAutoEraseDelay]);


  // handle the record duration timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      const interval = setInterval(() => {
        setRecordingDuration(recordingDuration => recordingDuration + 1);
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isRecording])

  // retrieve the list of webcam on init
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        navigator.mediaDevices.enumerateDevices()
          .then((devices) => {
            const videoDevices = devices.filter(d => d.kind === "videoinput");
            setDevices(videoDevices);
            stream.getTracks().forEach(x => x.stop());
          })
      })
      .catch(e => console.log(e));
  }, []);


  const addStream = async (opts: StreamFormValues) => {
    setAddStreamDialogOpen(false);
    const stream =
      opts.type === "webcam"
        ? await navigator.mediaDevices.getUserMedia({ audio: true, video: { deviceId: opts.deviceId } })
        : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });

    setTimeout(() => {
      composer && composer.addStream(stream, {
        position: opts.position,
        width: opts.width ? parseInt(opts.width) * WIDTH / 100 : undefined,
        height: opts.height ? parseInt(opts.height) * HEIGHT / 100 : undefined,
        x: opts.left ? parseInt(opts.left) * WIDTH / 100 : undefined,
        y: opts.top ? parseInt(opts.top) * HEIGHT / 100 : undefined,
        resizable: opts.resizable,
        draggable: opts.draggable,
        mask: opts.mask,
        name: `#${composer.getStreams().length} ${opts.type}`,
      });

      composer.appendCanvasTo("#canvas-container");
      setStreams(composer.getStreams());
    }, 100);
  }


  return (
    <div className={styles.container}>
      <ThemeProvider theme={theme}>
        <Head>
          <title>@api.video/media-stream-composer library sample application</title>
          <meta name="description" content="Next.js application showing the features offered by the @api.video/media-stream-composer library." />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <h1>@api.video/media-stream-composer library sample application</h1>
        <div>
          <p>This Next.js application aims to show the features offered by the <a target="_blank" rel="noreferrer" href="https://github.com/apivideo/api.video-typescript-media-stream-composer">@api.video/media-stream-composer</a> library. </p>
          <p>The code of the application is available on GitHub here: <a target="_blank" rel="noreferrer" href="https://github.com/apivideo/api.video-typescript-media-stream-composer/tree/main/examples/record.a.video">examples/record.a.video</a>.</p>

        </div>
        <div className={styles.columnsContainer}>
          <Paper className={styles.settingsPaper} elevation={4}>
            <h2>
              <p>Streams</p>

              <PopupState variant="popover" popupId="addStreamMenu">
                {(popupState) => (
                  <React.Fragment>
                    <Button variant="text" {...bindTrigger(popupState)}><AddCircleIcon sx={{ mr: 1 }} /> add a stream</Button>
                    <Menu {...bindMenu(popupState)}>
                      <MenuItem onClick={async () => { popupState.close(); setAddStreamDialogOpen(true); }}>Add a custom stream ...</MenuItem>

                      {devices.map(d =>
                        <MenuItem key={d.deviceId} onClick={async () => {
                          popupState.close();
                          addStream({
                            type: "webcam",
                            deviceId: d.deviceId,
                            position: "fixed",
                            height: "30%",
                            top: "68%",
                            left: "2%",
                            mask: "circle",
                            draggable: true,
                            resizable: true,
                          });
                        }}>Add rounded webcam in corner ({d.label})</MenuItem>)
                      }

                      <MenuItem onClick={async () => {
                        popupState.close();
                        addStream({
                          type: "screen",
                          position: "contain",
                          mask: "none",
                          draggable: false,
                          resizable: false,
                        });
                      }}>Add screencast in full-size</MenuItem>
                    </Menu>
                  </React.Fragment>
                )}
              </PopupState>

            </h2>

            {streams.length === 0
              ? <p className={styles.noStream}>No stream yet. Click <a onClick={async () => setAddStreamDialogOpen(true)}>here</a> to add a stream.</p>
              : <TableContainer className={styles.table}>
                <Table size="small" aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Stream name</TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {streams.sort((s1, s2) => s2.displaySettings.index - s1.displaySettings.index).map((row, i) => (
                      <TableRow
                        key={i}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {row.options.name}
                        </TableCell>
                        <TableCell className={styles.tableActions} align="right">
                          <Button disabled={i === 0} onClick={() => { composer.moveUp(row.id); setStreams(composer.getStreams()); }}><KeyboardDoubleArrowUpIcon /></Button>
                          <Button disabled={i === streams.length - 1} onClick={() => { composer.moveDown(row.id); setStreams(composer.getStreams()); }}><KeyboardDoubleArrowDownIcon /></Button>
                          <Button onClick={() => { composer.removeStream(row.id); setStreams(composer.getStreams()); }}><DeleteIcon></DeleteIcon></Button>
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            }


            <h2>Tool</h2>
            <FormControl component="fieldset">
              <FormGroup>
                <ToggleButtonGroup
                  fullWidth
                  size="small"
                  color="primary"
                  value={mouseTool}
                  exclusive
                  onChange={(v, w) => {
                    composer.setMouseTool(w);
                    setMouseTool(w);
                  }
                  }
                >
                  <ToggleButton disabled={streams.length === 0} value="move-resize"><AspectRatioIcon className={styles.toogleButtonIcon} /> Move / resize</ToggleButton>
                  <ToggleButton disabled={streams.length === 0} value="draw"><GestureIcon className={styles.toogleButtonIcon} /> Draw</ToggleButton>
                </ToggleButtonGroup>
                {mouseTool === "draw" && <>
                  <FormLabel component="legend">Line color</FormLabel>
                  <CirclePicker
                    color={drawingColor}
                    colors={['#FF6900', '#FCB900', '#9900EF', '#00D084', '#8ED1FC', '#0693E3']}
                    onChange={(color: any) => { setDrawingColor(color.hex) }}
                  />
                  <FormControl variant="standard">
                    <FormLabel component="legend">Auto erase delay</FormLabel>
                    <Select
                      labelId="width-select-standard-label"
                      id="width-select-standard"
                      value={drawingAutoEraseDelay}
                      onChange={(v, w) => { setDrawingAutoEraseDelay(parseInt(v.target.value as string)) }}
                      label="Auto erase delay"
                    >
                      <MenuItem value={0}>disabled</MenuItem>
                      <MenuItem value={3}>3 seconds</MenuItem>
                      <MenuItem value={5}>5 seconds</MenuItem>
                      <MenuItem value={10}>10 seconds</MenuItem>
                    </Select>
                  </FormControl>

                  <Button variant="outlined" style={{ marginTop: "1em" }} onClick={() => composer.clearDrawing()}>clear drawings</Button>

                </>}
              </FormGroup>
            </FormControl>


            <h2>Progressive upload</h2>

            <Button disabled={streams.length === 0} variant="contained" fullWidth color={isRecording ? "error" : "success"} onClick={async () => {
              if (!isRecording) {
                composer.startRecording({ uploadToken: UPLOAD_TOKEN! });
                setPlayerUrl(null);
                setIsRecording(true);
              } else {
                composer.stopRecording().then(e => setPlayerUrl(e.assets?.player || ""));
                setIsRecording(false);
              }
            }}>{!isRecording
              ? <><StartRecordingIcon className={styles.toogleButtonIcon} />start recording</>
              : <><StopRecordingIcon className={styles.toogleButtonIcon} />stop recording ({recordingDuration} sec)</>}
            </Button>
            {playerUrl !== null && <p>Your recording is here: <br /><a href={playerUrl} rel="noreferrer" target="_blank">{playerUrl}</a></p>}
          </Paper>


          <Paper elevation={4} className={styles.previewPaper}>
            <h2>Preview</h2>
            <div id="canvas-container" style={{ width: WIDTH, height: HEIGHT }} />
          </Paper>

          <StreamDialog
            open={addStreamDialogIsOpen}
            devices={devices}
            onClose={() => setAddStreamDialogOpen(false)}
            onSubmit={(values) => {
              addStream(values);
              setAddStreamDialogOpen(false);
            }} />
        </div>
      </ThemeProvider>
    </div>
  )
}

export default Home