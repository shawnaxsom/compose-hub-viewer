import React from "react";
import Button from "@mui/material/Button";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import {
  Container,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { parse, stringify } from "yaml";

// Note: This line relies on Docker Desktop's presence as a host application.
// If you're running this React app in a browser, it won't work properly.
const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

export function App() {
  const [composeFileList, setComposeFileList] = React.useState<
    {
      name: string;
      description: string;
      compose_file: string;
    }[]
  >([]);
  const [selectedCompose, setSelectedCompose] = React.useState<{
    name: string;
    description: string;
    compose_file: string;
  }>();
  const [composeFile, setComposeFile] = React.useState<string>();
  const [namespaces, setNamespaces] = React.useState<Array<string>>();
  const [repos, setRepos] = React.useState<Array<string>>();
  const ddClient = useDockerDesktopClient();

  const downloadComposeFiles = async () => {
    const result = await fetch("http://localhost:8000/composes");
    const json = await result.json();
    console.log("json", json);
    setComposeFileList(json as any);
  };

  const composeUp = async () => {
    setComposeFile("Compose Up...");
    try {
      // const result = (await ddClient.extension.vm?.service?.get(
      //   "/compose-file"
      // )) as any;
      setComposeFile(composeFile || "Nope");

      await ddClient.extension.host.cli.exec(
        `printf '${composeFile}' > docker-compose.yaml`,
        []
      );
      await ddClient.docker.cli.exec(`compose up`, ["-d"]);
      setComposeFile("✔ Compose Up complete\n\n---\n\n" + composeFile);
    } catch (e) {
      setComposeFile("Oops... " + JSON.stringify(e));
      return;
    }
  };

  const mainButtons = (
    <Stack direction="column" alignItems="end" spacing={2}>
      <Button variant="contained" onClick={downloadComposeFiles}>
        Download Compose Files
      </Button>
    </Stack>
  );

  console.log(composeFileList);

  const getComposes = () => {};

  const composeFiles = (
    <Stack
      direction="column"
      alignItems="start"
      spacing={2}
      sx={{ mt: 4 }}
      divider={<Divider orientation="horizontal" flexItem />}
    >
      {Object.keys(composeFileList)
        .flatMap((k) => composeFileList[k])
        .map(
          (listItem: {
            name: string;
            description: string;
            compose_file: string;
          }) => {
            return (
              <Stack direction="column">
                <Link
                  onClick={() => {
                    setSelectedCompose(listItem);
                    setComposeFile(decodeURIComponent(listItem.compose_file));

                    const yaml = parse(
                      decodeURIComponent(listItem.compose_file)
                    );
                    const namespacesFromComposeFile = [];
                    const reposFromComposeFile = [];

                    for (const serviceName in yaml.services) {
                      const service = yaml.services[serviceName];
                      const serviceRepo = service.image.replace(
                        /[:][a-zA-Z0-9]+/,
                        ""
                      );

                      const match = serviceRepo.match(
                        /^([a-zA-Z0-9-]+)[/]?([a-zA-Z0-9-]*)$/
                      );

                      if (match[2]) {
                        namespacesFromComposeFile.push(match[1]);
                      }

                      reposFromComposeFile.push(serviceRepo);
                    }

                    setNamespaces(namespacesFromComposeFile);
                    setRepos(reposFromComposeFile);
                  }}
                >
                  {listItem?.name}
                  {selectedCompose?.name === listItem?.name ? "*" : ""}
                </Link>
                {listItem?.description}
              </Stack>
            );
          }
        )}
    </Stack>
  );

  const composeFileTextField = (
    <TextField
      sx={{ width: 480 }}
      disabled
      multiline
      variant="outlined"
      minRows={5}
      value={composeFile}
    />
  );

  const composeFileMetadata = (
    <Stack
      direction="column"
      alignItems="start"
      spacing={2}
      sx={{ mt: 4 }}
      divider={<Divider orientation="horizontal" flexItem />}
    >
      <Stack direction="column">
        Namespaces
        <Link href="https://hub.docker.com/search?q=&image_filter=official">
          Official Images
        </Link>
        {namespaces &&
          namespaces.length > 0 &&
          namespaces.map((namespace) => (
            <Link href={`https://hub.docker.com/u/${namespace}`}>
              {namespace}
            </Link>
          ))}
      </Stack>
      <Stack direction="column">
        Repositories
        <Stack>
          {repos &&
            repos.length &&
            repos.map((repo) => (
              <Link
                href={
                  repo.indexOf("/") >= 0
                    ? `https://hub.docker.com/r/${repo}`
                    : `https://hub.docker.com/_/${repo}`
                }
              >
                {repo}
              </Link>
            ))}
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <>
      <Typography variant="h3">Compose-Hub-Viewer</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        This extension lists out Compose files you've uploaded, shows the
        contents, and lists links to mentioned Namespaces and Repositories.
      </Typography>
      <Stack direction="column" alignItems="start" spacing={2} sx={{ mt: 4 }}>
        <Stack direction="row" alignItems="start" spacing={2} sx={{ mt: 4 }}>
          {mainButtons}
          {composeFiles}
        </Stack>

        <Stack direction="row" alignItems="start" spacing={2} sx={{ mt: 4 }}>
          {composeFileTextField}

          <Stack
            direction="column"
            alignItems="start"
            spacing={2}
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              disabled={!composeFile}
              onClick={composeUp}
            >
              Compose Up
            </Button>
            {composeFileMetadata}
          </Stack>
        </Stack>
      </Stack>
    </>
  );
}
