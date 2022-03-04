#!/opt/gitlab/embedded/bin/ruby

require 'net/http'
require 'uri'
require 'json'

ARGS = JSON.parse($stdin.read)
# 仅当项目创建时才添加.pre-check文件
unless ARGS['event_name'] == 'project_create'
    # 设置对应gitlab服务端口
    uri = URI.parse("http://localhost/api/v4/projects/#{ARGS['project_id']}/repository/files/#{URI::encode('.pre-check')}")
    
    header = {
        'Content-Type': 'application/json',
        # 设置管理员用户的令牌
        'PRIVATE-TOKEN': 'glpat-xd1xKRCj99s9NTyZNR1N'
    }
    
    data = {
        branch: 'master',
        content: '',
        commit_message: 'Initial pre check commit'
    }
    
    # Create the HTTP objects
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Post.new(uri.request_uri, header)
    request.body = data.to_json
    
    # Send the request
    response = http.request(request)
end