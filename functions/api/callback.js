// GitHub가 되돌려 보내는 곳 — 받은 코드를 열쇠로 바꿔 Decap CMS에 건넨다.
//
// Decap은 이 창이 window.opener 로 보내는 메시지를 기다린다. 형식이 정해져 있어
// 그대로 맞춘다: "authorization:github:success:{...}"

// auth.js와 같은 이유로 앞뒤 공백·줄바꿈을 걸러낸다.
const clean = (v) => (v || '').replace(/\s+/g, '');

const page = (payload, origin) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>로그인 처리 중</title></head>
<body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; color: #14282A;">
<p>로그인 처리 중입니다. 창이 저절로 닫힙니다.</p>
<script>
  (function () {
    var payload = ${JSON.stringify(payload)};
    var target = ${JSON.stringify(origin)};
    function send(e) {
      window.opener.postMessage('authorization:github:' + payload.status + ':' + JSON.stringify(payload.content), e.origin);
      window.removeEventListener('message', send, false);
    }
    if (!window.opener) { document.body.textContent = '이 창을 직접 열지 마세요. 관리 화면에서 로그인을 눌러 주세요.'; return; }
    window.addEventListener('message', send, false);
    window.opener.postMessage('authorizing:github', target);
  })();
</script>
</body></html>`;

const fail = (message, origin) =>
  new Response(page({ status: 'error', content: { message } }, origin), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) return fail('GitHub가 코드를 보내지 않았습니다.', origin);

  // 우리가 보낸 요청에 대한 답이 맞는지 확인한다.
  const cookie = request.headers.get('Cookie') || '';
  const saved = (cookie.match(/(?:^|;\s*)cms_state=([^;]+)/) || [])[1];
  if (!saved || saved !== state) {
    return fail('로그인 요청이 확인되지 않았습니다. 관리 화면에서 다시 눌러 주세요.', origin);
  }

  let token;
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        client_id: clean(env.GITHUB_OAUTH_ID),
        client_secret: clean(env.GITHUB_OAUTH_SECRET),
        code,
        redirect_uri: `${origin}/api/callback`,
      }),
    });
    const data = await res.json();
    if (data.error || !data.access_token) {
      return fail('GitHub가 열쇠를 주지 않았습니다: ' + (data.error_description || data.error || '알 수 없는 오류'), origin);
    }
    token = data.access_token;
  } catch (e) {
    return fail('GitHub와 연결하지 못했습니다.', origin);
  }

  return new Response(page({ status: 'success', content: { token, provider: 'github' } }, origin), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // 쓴 값은 바로 지운다
      'Set-Cookie': 'cms_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      'Cache-Control': 'no-store',
    },
  });
}
