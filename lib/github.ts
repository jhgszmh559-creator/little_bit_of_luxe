export async function saveContentToGithub(
  relPath: string,
  fileContents: string,
  commitMessage?: string
): Promise<{ success: boolean; sha?: string; error?: string }> {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (!token) {
    throw new Error('GITHUB_ACCESS_TOKEN is not configured in environment variables');
  }

  const repo = 'jhgszmh559-creator/little_bit_of_luxe';
  const url = `https://api.github.com/repos/${repo}/contents/${relPath}`;
  const message = commitMessage || `Update ${relPath}`;
  const contentBase64 = Buffer.from(fileContents).toString('base64');

  // Step 1: Fetch the file metadata to get the SHA if the file already exists
  let sha: string | undefined = undefined;
  try {
    const getRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'NextJS-App',
      },
      cache: 'no-store',
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    } else if (getRes.status !== 404) {
      const errorText = await getRes.text();
      console.error(`GitHub API GET failed with status ${getRes.status}:`, errorText);
    }
  } catch (err: any) {
    console.error('Error fetching file metadata from GitHub:', err);
  }

  // Step 2: Push/Commit the file
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-App',
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      sha,
      branch: 'main',
    }),
  });

  if (!putRes.ok) {
    const errorText = await putRes.text();
    throw new Error(`GitHub API commit failed (${putRes.status}): ${errorText}`);
  }

  const putData = await putRes.json();
  return {
    success: true,
    sha: putData.content?.sha,
  };
}
