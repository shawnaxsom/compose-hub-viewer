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
  const [composeFile, setComposeFile] = React.useState<string>();
  const [repos, setRepos] = React.useState<Array<string>>();
  const ddClient = useDockerDesktopClient();

  const fetchAndDisplayResponse = async () => {
    const result = await ddClient.extension.vm?.service?.get("/hello");
    setComposeFile(JSON.stringify(result));
  };

  const downloadComposeFile = async () => {
    setComposeFile("Testing...");
    const result = (await ddClient.extension.vm?.service?.get(
      "/compose-up"
    )) as any;
    setComposeFile(JSON.stringify(result) || "Nope");

    const responseComposeFile = decodeURIComponent(result.Message);
    setComposeFile(responseComposeFile);

    const yaml = parse(responseComposeFile);
    // setComposeFile(JSON.stringify(yaml.services));

    const reposFromComposeFile = [];

    for (const serviceName in yaml.services) {
      const service = yaml.services[serviceName];
      const serviceRepo = service.image.replace(/[:][a-zA-Z0-9]+/, "");
      reposFromComposeFile.push(serviceRepo);
    }

    setRepos(reposFromComposeFile);
  };

  const composeUp = async () => {
    setComposeFile("Compose Up...");
    try {
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

  return (
    <>
      <Typography variant="h3">Compose-Hub-Viewer</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        This extension lists out Compose files you've uploaded, shows the
        contents, and lists links to mentioned Namespaces and Repositories.
      </Typography>
      <Stack direction="row" alignItems="start" spacing={2} sx={{ mt: 4 }}>
        <Stack direction="column" alignItems="end" spacing={2}>
          <Button variant="contained" onClick={downloadComposeFile}>
            Download Compose File
          </Button>

          <Button
            variant="contained"
            disabled={!composeFile}
            onClick={composeUp}
          >
            Compose Up
          </Button>
        </Stack>

        <TextField
          label="Backend response"
          sx={{ width: 480 }}
          disabled
          multiline
          variant="outlined"
          minRows={5}
          value={composeFile ?? ""}
        />
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
          </Stack>
          <Stack direction="column">
            Repositories
            <Stack>
              {repos &&
                repos.length &&
                repos.map((repo) => (
                  <Link href={`https://hub.docker.com/_/${repo}`}>{repo}</Link>
                ))}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
}
