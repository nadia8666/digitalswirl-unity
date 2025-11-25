using System;
using System.Collections.Generic;
using Luau;
using Unity.VisualScripting;
using UnityEditor;
using UnityEngine;

[CustomAirshipEditor("Character")]
public class CharacterEditor : AirshipEditor
{
    private int Tab = 0;
    public override void OnInspectorGUI()
    {

    }
    public void DrawContained()
    {
        Tab = AirshipEditorGUI.BeginTabs(Tab, new[]
        {
            new GUIContent("Collision"),
            new GUIContent("Physics"),
            new GUIContent("Moves"),
            new GUIContent("Renderer"),
        });

        switch (Tab)
        {
            case 0:
                DrawCollision();
                break;
            case 1:
                DrawPhysics();
                break;
            case 2:
                DrawMoves();
                break;
            case 3:
                DrawRenderer();
                break;
        }

        AirshipEditorGUI.EndTabs();
    }

    void DrawCollision()
    {
        PropertyFields("Height", "Scale", "Radius", "PositionError");
    }

    void DrawPhysics()
    {
        AirshipEditorGUI.BeginGroup(new GUIContent("Generic"));
        PropertyFields("Weight");
        AirshipEditorGUI.EndGroup();

        AirshipEditorGUI.BeginGroup(new GUIContent("Speed"));
        PropertyFields("MaxXSpeed", "JogSpeed", "RunSpeed", "RushSpeed", "DashSpeed", "CrashSpeed");
        PropertyFields("RollGetUp");
        AirshipEditorGUI.EndGroup();

        AirshipEditorGUI.BeginGroup(new GUIContent("Acceleration"));
        PropertyFields("AirAcceleration", "RunAcceleration", "AirDeceleration", "StandardDeceleration", "AirResist");
        AirshipEditorGUI.EndGroup();

        AirshipEditorGUI.BeginGroup(new GUIContent("Friction"));
        PropertyFields("SkidFriction", "GroundFriction", "Radius", "Weight");
        AirshipEditorGUI.EndGroup();

        AirshipEditorGUI.BeginGroup(new GUIContent("Jump"));
        PropertyFields("JumpInitialForce", "JumpHoldForce", "JumpTicks", "CoyoteFrames");
        AirshipEditorGUI.EndGroup();
    }

    void DrawMoves()
    {
        PropertyFields("HomingForceDash", "HomingForceAttack");
    }

    void DrawRenderer()
    {
        AirshipEditorGUI.BeginGroup(new GUIContent("Camera"));
        PropertyFields("CameraOffset");
        AirshipEditorGUI.EndGroup();

        AirshipEditorGUI.BeginGroup(new GUIContent("Jump Ball"));
        PropertyFields("JumpBallHeightAir", "JumpBallHeightRoll", "JumpStretchTimer", "JumpBallStretch");
        AirshipEditorGUI.EndGroup();
    }
}