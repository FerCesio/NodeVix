package com.lab1.nodevix;

public class ProjectDelta {
    private String action;
    private String projectId;
    private String nodeId;
    private Object payload;

    public ProjectDelta() {}

    public ProjectDelta(String action, String projectId, String nodeId, Object payload) {
        this.action = action;
        this.projectId = projectId;
        this.nodeId = nodeId;
        this.payload = payload;
    }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }

    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
