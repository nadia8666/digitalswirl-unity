using Luau;
using UnityEngine;

[CustomAirshipEditor("Config")]
public class ConfigEditor : AirshipEditor
{
    private int Tab = 0;
    public override void OnInspectorGUI()
    {
        Tab = AirshipEditorGUI.BeginTabs(Tab, new[]
        {
            new GUIContent("Animation"),
            new GUIContent("UI"),
            new GUIContent("Framework"),
            new GUIContent("CharacterInfo")
        });
        
        switch (Tab) 
        {
            case 0:
                DrawAnimationTab();
                break;
            case 1:
                DrawUITab();
                break;
            case 2:
                DrawFrameworkTab();
                break;
            case 3:
                DrawCharacterInfoTab();
                break;
        }

        AirshipEditorGUI.EndTabs();
    }

    void DrawAnimationTab()
    {
        PropertyFields("RigAnimationTilt", "HeadTilt", "EyeTilt");
    }

    void DrawUITab()
    {
        PropertyFields("ReticleMaxDistance", "ReticleDistanceCurve", "ReticleTimeMax", "ReticleRotationSpeed");
    }

    void DrawFrameworkTab()
    {
        PropertyFields("GameSpeed", "Tickrate", "CollisionLayer", "ObjectLayer", "RailLayer");
    }

    void DrawCharacterInfoTab()
    {
        PropertyField("Character");
        AirshipEditorGUI.BeginGroup(new GUIContent("Character Properties"));
        
        var Character = serializedObject.airshipComponent.gameObject.GetAirshipComponent(AirshipType.GetType("Character"));
        if (Character)
        {
            CharacterEditor Editor = (CharacterEditor)AirshipCustomEditors.GetEditor(Character); // can this fail?
            Editor.DrawContained();
        }

        AirshipEditorGUI.EndGroup();
    }
}