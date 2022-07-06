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

  const composeUp = async () => {
    setComposeFile("Testing...");
    const result = (await ddClient.extension.vm?.service?.get(
      "/compose-up"
    )) as any;
    setComposeFile(JSON.stringify(result) || "Nope");

    setComposeFile("Compose Up...");
    try {
      await ddClient.extension.host.cli.exec(
        `printf "${result.Message}" > docker-compose.yaml`,
        []
      );
      await ddClient.docker.cli.exec(`compose up`, ["-d"]);
    } catch (e) {
      setComposeFile("Oops... " + JSON.stringify(e));
      return;
    }

    const responseComposeFile = decodeURIComponent(result.Message);
    setComposeFile(responseComposeFile);

    const yaml = parse(responseComposeFile);
    // setComposeFile(JSON.stringify(yaml.services));

    const reposFromComposeFile = [];

    for (const serviceName in yaml.services) {
      const service = yaml.services[serviceName];
      reposFromComposeFile.push(service.image);
    }

    setRepos(reposFromComposeFile);
  };

  return (
    <>
      <Typography variant="h3">Docker extension demo</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        This is a basic page rendered with MUI, using Docker's theme. Read the
        MUI documentation to learn more. Using MUI in a conventional way and
        avoiding custom styling will help make sure your extension continues to
        look great as Docker's theme evolves.
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Pressing the below button will trigger a request to the backend. Its
        response will appear in the textarea.
      </Typography>
      <Stack direction="row" alignItems="start" spacing={2} sx={{ mt: 4 }}>
        <Button variant="contained" onClick={composeUp}>
          Compose up
        </Button>

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
