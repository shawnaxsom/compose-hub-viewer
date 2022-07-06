package main

import (
	"flag"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/labstack/echo"
	"github.com/sirupsen/logrus"
)

func main() {
	var socketPath string
	flag.StringVar(&socketPath, "socket", "/run/guest/volumes-service.sock", "Unix domain socket to listen on")
	flag.Parse()

	os.RemoveAll(socketPath)

	logrus.New().Infof("Starting listening on %s\n", socketPath)
	router := echo.New()
	router.HideBanner = true

	startURL := ""

	ln, err := listen(socketPath)
	if err != nil {
		log.Fatal(err)
	}
	router.Listener = ln

	router.GET("/hello", hello)
	router.GET("/compose-up", composeUp)

	log.Fatal(router.Start(startURL))
}

func listen(path string) (net.Listener, error) {
	return net.Listen("unix", path)
}

func hello(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, HTTPMessageBody{Message: "hello"})
}

func composeUp(ctx echo.Context) error {
	resp, _ := http.Get("https://gist.githubusercontent.com/adamelliotfields/cd49f056deab05250876286d7657dc4b/raw/31198290728608a78b47b0496ef51e60be6b6d0b/docker-compose.yml")

	body, _ := ioutil.ReadAll(resp.Body)

	return ctx.JSON(http.StatusOK, HTTPMessageBody{
		Message: string(body),
	})
}

type HTTPMessageBody struct {
	Message string
}
