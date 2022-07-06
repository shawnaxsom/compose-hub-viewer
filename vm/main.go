package main

import (
	"encoding/json"
	"flag"
	"fmt"
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
	router.GET("/compose-files", composeFileList)
	router.GET("/compose-file", composeFile)

	log.Fatal(router.Start(startURL))
}

type composeFileListItem struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func listen(path string) (net.Listener, error) {
	return net.Listen("unix", path)
}

func hello(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, HTTPMessageBody{Message: "hello"})
}

func composeFile(ctx echo.Context) error {
	resp, _ := http.Get("https://gist.githubusercontent.com/adamelliotfields/cd49f056deab05250876286d7657dc4b/raw/31198290728608a78b47b0496ef51e60be6b6d0b/docker-compose.yml")
	body, _ := ioutil.ReadAll(resp.Body)

	return ctx.JSON(http.StatusOK, HTTPMessageBody{
		Message: string(body),
	})
}

func composeFileList(ctx echo.Context) error {
	composeFiles := []composeFileListItem{{Name: "Foo", Description: "Bar"}, {Name: "Foo2", Description: "Bar2"}}

	e, err := json.Marshal(composeFiles)
	if err != nil {
		fmt.Println(err)
		return err
	}
	fmt.Println(string(e))

	return ctx.JSON(http.StatusOK, HTTPMessageBody{
		Message: string(e),
	})
}

type HTTPMessageBody struct {
	Message string
}
