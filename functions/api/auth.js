// GitHub 로그인 시작 — Decap CMS가 이 주소를 새 창으로 연다.
//
// Cloudflare Pages에는 Netlify 같은 로그인 기능이 없어서, GitHub와 주고받는
// 두 단계를 직접 둔다. 이 파일이 첫 단계다.
//   /api/auth      ← 여기. GitHub 로그인 화면으로 넘긴다
//   /api/callback  ← GitHub가 되돌려 보내는 곳. 열쇠를 받아 CMS에 건넨다
//
// 필요한 환경 변수 (Cloudflare Pages → Settings → Environment variables)
//   GITHUB_OAUTH_ID      OAuth App의 Client ID
//   GITHUB_OAUTH_SECRET  OAuth App의 Client Secret  ← 반드시 Secret(암호화)으로

// 환경 변수를 붙여 넣을 때 줄바꿈이나 공백이 섞여 들어오는 일이 잦다.
// 그대로 보내면 GitHub가 "그런 client_id는 없다"며 404를 낸다(client_id=...%0A).
const clean = (v) => (v || '').replace(/\s+/g, '');

export async function onRequestGet({ request, env }) {
  const clientId = clean(env.GITHUB_OAUTH_ID);
  if (!clientId) {
    return new Response(
      'GITHUB_OAUTH_ID가 설정되지 않았습니다. Cloudflare Pages의 환경 변수를 확인해 주세요.',
      { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }

  const url = new URL(request.url);

  // 넘겨받은 열쇠가 우리가 보낸 요청에 대한 답인지 확인하려고 무작위 값을 만든다.
  // 이 값을 쿠키에 담아 두었다가 callback에서 대조한다(CSRF 방지).
  const state = crypto.randomUUID();

  // Decap이 알려 주는 권한 범위를 그대로 쓴다. 비공개 저장소는 repo가 필요하다.
  const scope = url.searchParams.get('scope') || 'repo';

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `cms_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
      'Cache-Control': 'no-store',
    },
  });
}
