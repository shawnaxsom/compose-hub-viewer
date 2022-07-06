package main

import (
	"flag"
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
	return ctx.JSON(http.StatusOK, HTTPMessageBody{
		Message: `version: '2'
services:
  hello_world:
    image: ubuntu
    command: [/bin/echo, 'Hello world']`,
	})
}

type HTTPMessageBody struct {
	Message string
}
