// 获取插件数据（公开访问，无需认证）
export async function onRequestGet({ env }) {
  try {
    const data = await env.PLUGINS_KV.get('plugins');

    // 如果没有数据，返回默认示例数据
    if (!data) {
      const defaultData = [
        {
          id: 1,
          name: "示例插件 1",
          icon: "🔧",
          description: "这是一个示例插件的描述，展示插件的主要功能和特点。",
          category: "productivity",
          url: "https://chrome.google.com/webstore",
          tags: ["工具", "效率"],
          featured: true,
          order: 1
        },
        {
          id: 2,
          name: "示例插件 2",
          icon: "📝",
          description: "另一个示例插件，用于演示展示页面的效果。",
          category: "utility",
          url: "https://chrome.google.com/webstore",
          tags: ["实用", "浏览器"],
          featured: true,
          order: 2
        }
      ];

      return new Response(JSON.stringify(defaultData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '获取数据失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 保存插件数据（仅在 /admin 下使用，受 Cloudflare Access 保护）
export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    // 验证数据格式
    if (!Array.isArray(data)) {
      return new Response(JSON.stringify({ error: '数据格式错误' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 保存到 KV
    await env.PLUGINS_KV.put('plugins', JSON.stringify(data));

    return new Response(JSON.stringify({ success: true, message: '保存成功' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '保存失败: ' + error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理 OPTIONS 请求（CORS 预检）
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
