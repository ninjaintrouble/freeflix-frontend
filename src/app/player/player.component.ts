import {Component, OnInit, OnDestroy, Input, HostListener} from "@angular/core"
import {YtsService} from "../service/yts.service"
import {ActivatedRoute} from "@angular/router"
import {environment} from "../../environments/environment"
import {MatIconRegistry} from "@angular/material"
import {DomSanitizer} from "@angular/platform-browser"

interface Document {
  exitFullscreen: any
  mozCancelFullScreen: any
  webkitExitFullscreen: any
  fullscreenElement: any
  mozFullScreenElement: any
  webkitFullscreenElement: any
}

@Component({
  selector: "app-player",
  templateUrl: "./player.component.html",
  styleUrls: ["./player.component.scss"]
})
export class PlayerComponent implements OnInit, OnDestroy {
  static DARK_THEME_BG_COLOR = "#303030"
  static DIM_BG_COLOR = "#111111"

  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private ytsService: YtsService,
    private route: ActivatedRoute) {
    iconRegistry.addSvgIcon(
      "cc",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/icons/player/closed-captioning.svg"))
    iconRegistry.addSvgIcon(
      "compress",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/icons/player/compress.svg"))
    iconRegistry.addSvgIcon(
      "expand",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/icons/player/expand.svg"))
    iconRegistry.addSvgIcon(
      "pause",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/icons/player/pause.svg"))
    iconRegistry.addSvgIcon(
      "play",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/icons/player/play.svg"))
    iconRegistry.addSvgIcon(
      "volume-up",
      sanitizer.bypassSecurityTrustResourceUrl("../assets/icons/player/volume-up.svg"))
  }

  public loadingText = "fetching torrent"
  public isLoading = true
  public videoAvailable = false
  public currentMediaURL: string
  public endpoint = environment.endpoint
  @Input() videoTitle: string
  public infoHash: string
  public playing: boolean

  ngOnInit() {
    // Cover image if video is not started.
    this.fetchTorrent()
  }

  ngOnDestroy() {
    document.body.style.backgroundColor = PlayerComponent.DARK_THEME_BG_COLOR
  }

  private fetchTorrent() {
    this.infoHash = this.route.snapshot.queryParamMap.get("movie")
    this.currentMediaURL = this.endpoint + "/api/movie/watch?infoHash=" + this.infoHash
    if (this.infoHash === null || this.infoHash === "") {
      this.loadingText = "video is unavailable"
      return
    }
    this.ytsService.pollForMovieFetched(this.infoHash).subscribe(_ => {
      this.loadingText = "buffering"
      this.isLoading = false
      this.videoAvailable = true
      // We need to wait a bit for the video tag to render in the DOM.
      setTimeout(() => {
        this.initControls()
      }, 100)
    })
  }

  // You can Play/Pause the video by pressing the space bar.
  @HostListener("document:keypress", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    const KEYCODE_SPACE = 32
    const video = <HTMLVideoElement>document.getElementById("video")
    if (event.keyCode === KEYCODE_SPACE && video != null) {
      if (video.paused || video.ended) {
        video.play()
        this.playing = true
        document.body.style.backgroundColor = PlayerComponent.DIM_BG_COLOR
      } else {
        video.pause()
        this.playing = false
        document.body.style.backgroundColor = PlayerComponent.DARK_THEME_BG_COLOR
      }
    }
  }
  
  // Initialize the video controls. This is a bit messy because we often need to consider specific browser prefixes.
  // Implementation ported from MDN Network: Creating a cross-browser video player.
  private initControls() {
    // We assume the browser supports the video tag.
    const videoContainer = document.getElementById("videoContainer")
    const video = <HTMLVideoElement>document.getElementById("video")
    const videoControls = document.getElementById("video-controls")
    video.controls = false

    const playpause = document.getElementById("playpause")
    const mute = document.getElementById("mute")
    const volinc = document.getElementById("volinc")
    const voldec = document.getElementById("voldec")
    const progress = document.getElementById("progress")
    const progressBar = document.getElementById("progress-bar")
    const fullscreen = document.getElementById("fs")

    playpause.addEventListener("click", () => {
      if (video.paused || video.ended) {
        video.play()
        this.playing = true
        document.body.style.backgroundColor = PlayerComponent.DIM_BG_COLOR
      } else {
        video.pause()
        this.playing = false
        document.body.style.backgroundColor = PlayerComponent.DARK_THEME_BG_COLOR
      }
    })

    mute.addEventListener("click", () => {
      video.muted = !video.muted
    })

    volinc.addEventListener("click", () => {
      alterVolume("+")
    })

    voldec.addEventListener("click", () => {
      alterVolume("-")
    })

    const alterVolume = (dir) => {
      const currentVolume = Math.floor(video.volume * 10) / 10
      if (dir === "+") {
        if (currentVolume < 1) {
          video.volume += 0.1
        }
      } else if (dir === "-") {
        if (currentVolume > 0) {
          video.volume -= 0.1
        }
      }
    }
    fullscreen.addEventListener("click", () => {
      handleFullscreen()
    })

    // Web development is fun!
    const handleFullscreen = () => {
      if (isFullScreen()) {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document["mozCancelFullScreen"]) {
          document["mozCancelFullScreen"]()
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen()
        } else if (document["msExitFullscreen"]) {
          document["msExitFullscreen"]()
        }
      } else {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen()
        } else if (videoContainer["mozRequestFullScreen"]) {
          videoContainer["mozRequestFullScreen"]()
        } else if (videoContainer.webkitRequestFullScreen) {
          videoContainer.webkitRequestFullScreen()
        } else if (videoContainer["msRequestFullscreen"]) {
          videoContainer["msRequestFullscreen"]()
        }
      }
    }
    const isFullScreen = function () {
      return !!(document["fullScreen"] || document["webkitIsFullScreen"] ||
        document["mozFullScreen"] || document["msFullscreenElement"] || document.fullscreenElement)
    }

  }// End init controls
}
