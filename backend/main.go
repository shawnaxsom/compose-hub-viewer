package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"net/http"
)

var DB map[string]map[string]Compose // namespace -> name -> Compose

type Compose struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	Description string `json:"description"`
	IsPrivate   bool   `json:"is_private"`
	ComposeFile string `json:"compose_file"`
}

func main() {
	DB = make(map[string]map[string]Compose)
	r := mux.NewRouter()

	r.HandleFunc("/composes", ComposesHandler).Methods("POST")
	r.HandleFunc("/composes/{namespace}", GetComposesByNamespace).Methods("GET")
	r.HandleFunc("/composes/{namespace}/{name}", GetCompose).Methods("GET")

	http.ListenAndServe(":8000", handlers.CORS()(r))
	http.ListenAndServe(":8000", r)
}

func ComposesHandler(w http.ResponseWriter, r *http.Request) {
	var compose Compose
	err := json.NewDecoder(r.Body).Decode(&compose)
	if err != nil {
		println(err.Error())
	}

	if _, ok := DB[compose.Namespace]; !ok {
		DB[compose.Namespace] = make(map[string]Compose)
	}
	DB[compose.Namespace][compose.Name] = compose

	writeResponse(w, compose)
}

func GetComposesByNamespace(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	c, _ := getComposesByNamespace(namespace)

	writeResponse(w, c)
}

func GetCompose(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	c, err := getCompose(namespace, name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	writeResponse(w, c)
}

func getComposesByNamespace(namespace string) ([]Compose, error) {
	var composes []Compose
	ns, ok := DB[namespace]
	if !ok {
		return composes, nil
	}
	for name := range ns {
		composes = append(composes, ns[name])
	}
	return composes, nil
}

func getCompose(namespace, name string) (*Compose, error) {
	ns, ok := DB[namespace]
	if !ok {
		return nil, fmt.Errorf("didn't find compose")
	}
	n, ok := ns[name]
	if !ok {
		return nil, fmt.Errorf("didn't find compose")
	}
	return &n, nil
}

func writeResponse(w http.ResponseWriter, resp interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(&resp)
}