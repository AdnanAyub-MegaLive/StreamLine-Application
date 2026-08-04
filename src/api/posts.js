import axios from 'axios';
import { apiClient } from './client';
import { fixLocalhostOrigin } from './uploads';

function authHeaders(sessionToken) {
  return { headers: { Authorization: `Bearer ${sessionToken}` } };
}

export class CreatePostError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = 'CreatePostError';
    this.code = code;
  }
}

// GET /api/posts — see docs/discover-posts-api-spec.md (requested, not yet
// built on StreamLine-Portal as of this writing). The Discover feed —
// newest first. Throws on failure so DiscoverScreen can show a real
// "couldn't load" state instead of silently rendering an empty feed.
export async function fetchPosts(sessionToken, cursor) {
  const response = await apiClient.get('/api/posts', {
    ...authHeaders(sessionToken),
    params: cursor ? { cursor } : undefined
  });
  const data = response.data?.data ?? {};
  return {
    posts: (data.posts ?? []).map(post => (post.imageUrl ? { ...post, imageUrl: fixLocalhostOrigin(post.imageUrl) } : post)),
    nextCursor: data.nextCursor ?? null
  };
}

// POST /api/posts — multipart/form-data because of the photo (a local file
// uri straight from the image picker, same pattern as agency CNIC uploads
// used before that flow dropped the requirement). `imageUri` is optional —
// a post can be description-only.
export async function createPost(sessionToken, { description, imageUri, imageType, imageFileName }) {
  const form = new FormData();
  form.append('description', description.trim());
  if (imageUri) {
    form.append('image', {
      uri: imageUri,
      type: imageType ?? 'image/jpeg',
      name: imageFileName ?? 'post.jpg'
    });
  }
  try {
    const response = await apiClient.post('/api/posts', form, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new CreatePostError(message ?? 'Unable to post.', code);
    }
    throw new CreatePostError('Could not reach the server. Try again.', 'NETWORK');
  }
}

// PATCH /api/posts/:postId — see docs/discover-posts-edit-delete-spec.md
// (requested, not yet built). Owner-only edit; omit imageUri and
// removeImage to leave the existing image untouched.
export async function updatePost(sessionToken, postId, { description, imageUri, imageType, imageFileName, removeImage }) {
  const form = new FormData();
  form.append('description', description.trim());
  if (imageUri) {
    form.append('image', {
      uri: imageUri,
      type: imageType ?? 'image/jpeg',
      name: imageFileName ?? 'post.jpg'
    });
  } else if (removeImage) {
    form.append('removeImage', 'true');
  }
  try {
    const response = await apiClient.patch(`/api/posts/${postId}`, form, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new CreatePostError(message ?? 'Unable to save changes.', code);
    }
    throw new CreatePostError('Could not reach the server. Try again.', 'NETWORK');
  }
}

// DELETE /api/posts/:postId — see docs/discover-posts-edit-delete-spec.md
// (requested, not yet built). Owner-only.
export async function deletePost(sessionToken, postId) {
  try {
    await apiClient.delete(`/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new CreatePostError(message ?? 'Unable to delete this post.', code);
    }
    throw new CreatePostError('Could not reach the server. Try again.', 'NETWORK');
  }
}
